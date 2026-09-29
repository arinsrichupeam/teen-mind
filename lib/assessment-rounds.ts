import type { CaseStatus, ScreeningResult } from "@prisma/client";

/**
 * Multi-round assessment gates (ADR 0006).
 * Pure helpers — Prisma I/O lives in API/services.
 */

export function isAssessmentRoundComplete(
  result: ScreeningResult | string | null | undefined
): boolean {
  return result != null && result !== "INCOMPLETE";
}

/** Next AssessmentRound number given existing instrument/note round ids. */
export function nextAssessmentRoundNumber(existingRounds: number[]): number {
  if (existingRounds.length === 0) return 1;

  return Math.max(...existingRounds) + 1;
}

export type OpenAssessmentRoundInput = {
  caseStatus: CaseStatus | string;
  currentResult: ScreeningResult | string | null | undefined;
};

/**
 * Citizen or staff may open AssessmentRound N+1 when the Case is mutable
 * and the current screening round is complete (TreatmentNote not required).
 */
export function assertCanOpenAssessmentRound(
  input: OpenAssessmentRoundInput
): void {
  if (input.caseStatus === "CLOSED") {
    throw new Error(
      "Case ถูกปิดแล้ว — ต้องสร้าง Case ใหม่เพื่อคัดกรอง (ADR 0005)"
    );
  }

  if (input.caseStatus === "TRANSFER_PENDING") {
    throw new Error(
      "Case อยู่ระหว่างส่งต่อ — รับหรือปฏิเสธก่อนเปิดรอบประเมินใหม่"
    );
  }

  if (!isAssessmentRoundComplete(input.currentResult)) {
    throw new Error(
      "รอบคัดกรองปัจจุบันยังไม่ครบ (INCOMPLETE) — ไม่สามารถเปิดรอบใหม่ได้"
    );
  }
}

export type AssessmentRoundHistoryItem = {
  round: number;
  result: ScreeningResult | string;
  /** true when this round has enough instruments to be considered finished */
  complete: boolean;
};
