import type { CaseStatus, ScreeningResult } from "@prisma/client";

import { getAssessmentResultLabel } from "@/lib/assessment-result-colors";
import { countConsultRoundsFromNotes } from "@/lib/case-round-counts";
import { mapScreeningResultToLegacyColor } from "@/lib/legacy-value-mapping";

export type ProfileCaseHistorySummary = {
  id: string;
  createdAt: string;
  status: CaseStatus | string;
  result: ScreeningResult | string;
  resultLabel: string;
  consultRoundCount: number;
  assessmentRoundCount: number;
  facilityName: string | null;
  closeCaseReason: string | null;
};

type RoundRow = { round?: number | null };

function collectRounds(rows: RoundRow[] | undefined, into: Set<number>) {
  for (const row of rows ?? []) {
    if (typeof row.round === "number" && row.round > 0) {
      into.add(row.round);
    }
  }
}

/** จำนวน AssessmentRound จากแถวแบบประเมินดิบ (ไม่ต้องผ่าน QuestionsData) */
export function countAssessmentRoundsFromInstruments(instruments: {
  questions2Q?: RoundRow[];
  questions9Q?: RoundRow[];
  questionsPhqa?: RoundRow[];
  questions8Q?: RoundRow[];
  questionsPhqaAddon?: RoundRow[];
  questionsProblem?: RoundRow[];
}): number {
  const rounds = new Set<number>();

  collectRounds(instruments.questions2Q, rounds);
  collectRounds(instruments.questions9Q, rounds);
  collectRounds(instruments.questionsPhqa, rounds);
  collectRounds(instruments.questions8Q, rounds);
  collectRounds(instruments.questionsPhqaAddon, rounds);
  collectRounds(instruments.questionsProblem, rounds);

  if (rounds.size > 0) return rounds.size;

  const hasAny =
    (instruments.questions2Q?.length ?? 0) > 0 ||
    (instruments.questions9Q?.length ?? 0) > 0 ||
    (instruments.questionsPhqa?.length ?? 0) > 0 ||
    (instruments.questions8Q?.length ?? 0) > 0 ||
    (instruments.questionsPhqaAddon?.length ?? 0) > 0 ||
    (instruments.questionsProblem?.length ?? 0) > 0;

  return hasAny ? 1 : 0;
}

export function resultLabelFromScreeningResult(
  result: ScreeningResult | string | null | undefined
): string {
  const color = mapScreeningResultToLegacyColor(result);

  return color ? getAssessmentResultLabel(color) : String(result ?? "");
}

type CaseHistorySource = {
  id: string;
  createdAt: Date | string;
  status: CaseStatus | string;
  result: ScreeningResult | string;
  closeCaseReason?: string | null;
  healthcareFacility?: { name?: string | null } | null;
  treatmentNotes?: Parameters<typeof countConsultRoundsFromNotes>[0];
  questions2Q?: RoundRow[];
  questions9Q?: RoundRow[];
  questionsPhqa?: RoundRow[];
  questions8Q?: RoundRow[];
  questionsPhqaAddon?: RoundRow[];
  questionsProblem?: RoundRow[];
};

/** Map a Case (+ notes / instruments) to the service-history list row. */
export function toProfileCaseHistorySummary(
  caseRow: CaseHistorySource
): ProfileCaseHistorySummary {
  const createdAt =
    caseRow.createdAt instanceof Date
      ? caseRow.createdAt.toISOString()
      : String(caseRow.createdAt);

  return {
    id: caseRow.id,
    createdAt,
    status: caseRow.status,
    result: caseRow.result,
    resultLabel: resultLabelFromScreeningResult(caseRow.result),
    consultRoundCount: countConsultRoundsFromNotes(
      caseRow.treatmentNotes ?? []
    ),
    assessmentRoundCount: countAssessmentRoundsFromInstruments(caseRow),
    facilityName: caseRow.healthcareFacility?.name?.trim() || null,
    closeCaseReason: caseRow.closeCaseReason ?? null,
  };
}
