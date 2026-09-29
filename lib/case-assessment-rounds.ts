import { CaseStatus, ScreeningResult } from "@prisma/client";

import {
  calculateMainAssessmentResult,
  type MainAssessmentScale,
} from "@/lib/assessment-scale";
import {
  assertCanOpenAssessmentRound,
  nextAssessmentRoundNumber,
  type AssessmentRoundHistoryItem,
} from "@/lib/assessment-rounds";
import { isTwoQPositive } from "@/lib/depression-flow";
import { mapLegacyRiskColorToScreeningResult } from "@/lib/legacy-value-mapping";
import { prisma } from "@/utils/prisma";

async function collectInstrumentRounds(caseId: string): Promise<number[]> {
  const [q2, q9, phqa, q8, problem] = await Promise.all([
    prisma.question2Q.findMany({
      where: { caseId },
      select: { round: true },
    }),
    prisma.question9Q.findMany({
      where: { caseId },
      select: { round: true },
    }),
    prisma.questionPhqa.findMany({
      where: { caseId },
      select: { round: true },
    }),
    prisma.question8Q.findMany({
      where: { caseId },
      select: { round: true },
    }),
    prisma.questionProblem.findMany({
      where: { caseId },
      select: { round: true },
    }),
  ]);

  return [
    ...q2.map((r) => r.round),
    ...q9.map((r) => r.round),
    ...phqa.map((r) => r.round),
    ...q8.map((r) => r.round),
    ...problem.map((r) => r.round),
  ];
}

export async function getNextAssessmentRound(caseId: string): Promise<number> {
  return nextAssessmentRoundNumber(await collectInstrumentRounds(caseId));
}

/** Highest existing instrument round for a Case, or null if none. */
export async function getLatestInstrumentRound(
  caseId: string
): Promise<number | null> {
  const rounds = await collectInstrumentRounds(caseId);

  if (rounds.length === 0) return null;

  return Math.max(...rounds);
}

/**
 * Recompute ScreeningResult for one AssessmentRound from stored instruments.
 * Wave-1 DEPRESSION path: 2Q → (PHQA|9Q) → optional 8Q → Problem.
 */
export async function computeScreeningResultForRound(
  caseId: string,
  round: number,
  scale: MainAssessmentScale
): Promise<ScreeningResult> {
  const q2 = await prisma.question2Q.findUnique({
    where: { caseId_round: { caseId, round } },
  });

  if (!q2) {
    return ScreeningResult.INCOMPLETE;
  }

  if (!isTwoQPositive(q2.q1, q2.q2)) {
    return ScreeningResult.NEGATIVE;
  }

  if (scale === "9Q") {
    const q9 = await prisma.question9Q.findUnique({
      where: { caseId_round: { caseId, round } },
    });

    if (!q9) return ScreeningResult.INCOMPLETE;

    const { result } = calculateMainAssessmentResult(q9.sum, "9Q");

    return mapLegacyRiskColorToScreeningResult(result);
  }

  const phqa = await prisma.questionPhqa.findUnique({
    where: { caseId_round: { caseId, round } },
  });

  if (!phqa) return ScreeningResult.INCOMPLETE;

  const { result } = calculateMainAssessmentResult(phqa.sum, "PHQA");

  return mapLegacyRiskColorToScreeningResult(result);
}

/**
 * Open AssessmentRound N+1 on an open Case (ADR 0006).
 * Sets Case.result to INCOMPLETE; TreatmentNote not required.
 */
export async function openAssessmentRound(caseId: string): Promise<{
  caseId: string;
  round: number;
  status: CaseStatus;
  result: ScreeningResult;
}> {
  const existing = await prisma.case.findUniqueOrThrow({
    where: { id: caseId },
    select: { id: true, status: true, result: true },
  });

  assertCanOpenAssessmentRound({
    caseStatus: existing.status,
    currentResult: existing.result,
  });

  const round = await getNextAssessmentRound(caseId);

  const updated = await prisma.case.update({
    where: { id: caseId },
    data: {
      result: ScreeningResult.INCOMPLETE,
      status:
        existing.status === CaseStatus.PENDING
          ? CaseStatus.IN_PROGRESS
          : existing.status,
    },
    select: { id: true, status: true, result: true },
  });

  return {
    caseId: updated.id,
    round,
    status: updated.status,
    result: updated.result,
  };
}

/** Per-round history derived from Question* (+ Case.result for the tip). */
export async function listAssessmentRoundHistory(
  caseId: string,
  caseResult: ScreeningResult,
  scale: MainAssessmentScale
): Promise<AssessmentRoundHistoryItem[]> {
  const rounds = Array.from(
    new Set(await collectInstrumentRounds(caseId))
  ).sort((a, b) => a - b);

  if (rounds.length === 0) {
    return [
      {
        round: 1,
        result: caseResult,
        complete: caseResult !== ScreeningResult.INCOMPLETE,
      },
    ];
  }

  const latest = rounds[rounds.length - 1]!;
  const items: AssessmentRoundHistoryItem[] = [];

  for (const round of rounds) {
    if (round === latest && caseResult === ScreeningResult.INCOMPLETE) {
      items.push({
        round,
        result: ScreeningResult.INCOMPLETE,
        complete: false,
      });
      continue;
    }

    const result = await computeScreeningResultForRound(caseId, round, scale);

    items.push({
      round,
      result,
      complete: result !== ScreeningResult.INCOMPLETE,
    });
  }

  return items;
}
