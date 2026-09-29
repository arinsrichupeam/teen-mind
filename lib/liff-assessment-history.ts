import { ScreeningResult } from "@prisma/client";

import {
  calculateMainAssessmentResult,
  type MainAssessmentScale,
} from "@/lib/assessment-scale";
import { getAssessmentResultLabel } from "@/lib/assessment-result-colors";
import { isTwoQPositive } from "@/lib/depression-flow";
import {
  mapLegacyRiskColorToScreeningResult,
  mapScreeningResultToLegacyColor,
} from "@/lib/legacy-value-mapping";
import { caseStatusLabel } from "@/lib/case-status-mapping";

export { caseStatusLabel };

export type RoundInstrument = {
  round: number;
  q1?: number;
  q2?: number;
  sum?: number;
  createdAt?: string | Date;
};

export type CaseHistorySource = {
  id: string;
  createdAt: string | Date;
  result: ScreeningResult | string;
  status: string;
  questions2Q?: RoundInstrument[];
  questions9Q?: RoundInstrument[];
  questionsPhqa?: RoundInstrument[];
  questions8Q?: RoundInstrument[];
  questionsProblem?: RoundInstrument[];
};

export type InstrumentLine = {
  name: string;
  detail: string;
  skipped?: boolean;
};

export type AssessmentRoundDetail = {
  round: number;
  createdAt: string | Date;
  overallResult: ScreeningResult | string;
  overallLabel: string;
  instruments: InstrumentLine[];
};

export type CaseHistoryGroup = {
  caseId: string;
  /** ลำดับชุดประเมินตามเวลาเปิด (1 = เก่าสุด) */
  caseNumber: number;
  createdAt: string | Date;
  status: string;
  statusLabel: string;
  isOpen: boolean;
  tipResult: ScreeningResult | string;
  tipLabel: string;
  rounds: AssessmentRoundDetail[];
};

const OPEN_STATUSES = new Set(["PENDING", "IN_PROGRESS", "TRANSFER_PENDING"]);

export function getEightQRiskLabel(sum: number): string {
  if (sum === 0) return "ไม่มีแนวโน้มฆ่าตัวตายในปัจจุบัน";
  if (sum <= 8) return "แนวโน้มฆ่าตัวตาย ระดับน้อย";
  if (sum <= 16) return "แนวโน้มฆ่าตัวตาย ระดับปานกลาง";

  return "แนวโน้มฆ่าตัวตาย ระดับรุนแรง";
}

export function overallResultLabel(result: ScreeningResult | string): string {
  if (String(result) === "INCOMPLETE") return "ยังทำไม่ครบ";

  const legacy = mapScreeningResultToLegacyColor(result);

  return legacy ? getAssessmentResultLabel(legacy) : String(result);
}

function resultForRound(
  caseRow: CaseHistorySource,
  round: number,
  isLatestOnCase: boolean
): ScreeningResult | string {
  if (isLatestOnCase) return caseRow.result;

  const q2 = caseRow.questions2Q?.find((r) => r.round === round);

  if (!q2 || !isTwoQPositive(q2.q1 ?? 0, q2.q2 ?? 0)) {
    return ScreeningResult.NEGATIVE;
  }

  const q9 = caseRow.questions9Q?.find((r) => r.round === round);
  const phqa = caseRow.questionsPhqa?.find((r) => r.round === round);
  const scale: MainAssessmentScale = q9 ? "9Q" : "PHQA";
  const sum = q9?.sum ?? phqa?.sum;

  if (sum == null) return ScreeningResult.INCOMPLETE;

  const { result } = calculateMainAssessmentResult(sum, scale);

  return mapLegacyRiskColorToScreeningResult(result);
}

function buildRoundInstruments(
  caseRow: CaseHistorySource,
  round: number
): InstrumentLine[] {
  const lines: InstrumentLine[] = [];
  const q2 = caseRow.questions2Q?.find((r) => r.round === round);
  const q9 = caseRow.questions9Q?.find((r) => r.round === round);
  const phqa = caseRow.questionsPhqa?.find((r) => r.round === round);
  const q8 = caseRow.questions8Q?.find((r) => r.round === round);
  const problem = caseRow.questionsProblem?.find((r) => r.round === round);

  if (q2) {
    const positive = isTwoQPositive(q2.q1 ?? 0, q2.q2 ?? 0);

    lines.push({
      name: "2Q",
      detail: positive ? "เข้าเกณฑ์ประเมินต่อ" : "ไม่เข้าเกณฑ์ (ปกติ)",
    });
  } else {
    lines.push({ name: "2Q", detail: "ไม่มีข้อมูล", skipped: true });
  }

  const twoQPositive = q2 ? isTwoQPositive(q2.q1 ?? 0, q2.q2 ?? 0) : false;

  if (!twoQPositive) {
    lines.push({
      name: "แบบประเมินหลัก",
      detail: "ข้าม — 2Q ไม่เข้าเกณฑ์",
      skipped: true,
    });
    lines.push({
      name: "8Q",
      detail: "ข้าม — ไม่เข้าเกณฑ์",
      skipped: true,
    });
  } else if (q9) {
    const { result } = calculateMainAssessmentResult(q9.sum ?? 0, "9Q");

    lines.push({
      name: "9Q",
      detail: `${q9.sum ?? 0} คะแนน · ${getAssessmentResultLabel(result)}`,
    });
  } else if (phqa) {
    const { result } = calculateMainAssessmentResult(phqa.sum ?? 0, "PHQA");

    lines.push({
      name: "PHQ-A",
      detail: `${phqa.sum ?? 0} คะแนน · ${getAssessmentResultLabel(result)}`,
    });
  } else {
    lines.push({
      name: "แบบประเมินหลัก",
      detail: "ยังไม่มีคะแนน",
      skipped: true,
    });
  }

  if (twoQPositive) {
    if (q8 && q8.sum != null) {
      lines.push({
        name: "8Q",
        detail: `${q8.sum} คะแนน · ${getEightQRiskLabel(q8.sum)}`,
      });
    } else {
      lines.push({
        name: "8Q",
        detail: "ไม่เข้าเกณฑ์ / ไม่ได้ทำ",
        skipped: true,
      });
    }
  }

  if (problem && problem.sum != null) {
    lines.push({
      name: "ปัญหาที่พบ",
      detail:
        problem.sum > 0 ? `ระบุ ${problem.sum} หัวข้อ` : "ไม่ได้ระบุปัญหา",
    });
  }

  return lines;
}

/** Case-centric history: newest Case first; rounds ascending within each Case. */
export function buildCaseCentricHistory(
  cases: CaseHistorySource[]
): CaseHistoryGroup[] {
  const chronological = [...cases].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const groups: CaseHistoryGroup[] = chronological.map((caseRow, index) => {
    const rounds = Array.from(
      new Set((caseRow.questions2Q ?? []).map((r) => r.round))
    ).sort((a, b) => a - b);

    const latestRound = rounds.length > 0 ? rounds[rounds.length - 1]! : null;

    const roundDetails: AssessmentRoundDetail[] =
      rounds.length === 0
        ? [
            {
              round: 1,
              createdAt: caseRow.createdAt,
              overallResult: caseRow.result,
              overallLabel: overallResultLabel(caseRow.result),
              instruments: [],
            },
          ]
        : rounds.map((round) => {
            const q2 = caseRow.questions2Q?.find((r) => r.round === round);
            const overall = resultForRound(
              caseRow,
              round,
              round === latestRound
            );

            return {
              round,
              createdAt: q2?.createdAt ?? caseRow.createdAt,
              overallResult: overall,
              overallLabel: overallResultLabel(overall),
              instruments: buildRoundInstruments(caseRow, round),
            };
          });

    return {
      caseId: caseRow.id,
      caseNumber: index + 1,
      createdAt: caseRow.createdAt,
      status: String(caseRow.status),
      statusLabel: caseStatusLabel(String(caseRow.status)),
      isOpen: OPEN_STATUSES.has(String(caseRow.status)),
      tipResult: caseRow.result,
      tipLabel: overallResultLabel(caseRow.result),
      rounds: roundDetails,
    };
  });

  return groups.reverse();
}
