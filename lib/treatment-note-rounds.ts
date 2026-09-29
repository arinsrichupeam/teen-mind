import type { TreatmentNoteLike } from "@/lib/case-flat";

import {
  assertSessionReportForSoapSave,
  isSessionReportComplete,
  isSoapFieldsComplete,
  type AfterCarePlanCode,
  type PsychRiskSeverity,
  type SessionOutcomeCode,
  type SessionSelfHarmRiskCode,
} from "@/lib/session-report";

export type TreatmentNoteDraft = TreatmentNoteLike & {
  round: number;
};

export function emptyTreatmentNote(round: number): TreatmentNoteDraft {
  return {
    round,
    consult: null,
    scheduleTelemed: null,
    serviceEndedAt: null,
    unreachable: false,
    subjective: null,
    objective: null,
    assessment: null,
    plan: null,
    note: null,
    sessionSelfHarmRisk: null,
    psychRisk: null,
    presentingTopics: [],
    presentingTopicsOther: null,
    interventions: [],
    interventionsOther: null,
    sessionOutcome: null,
    afterCarePlan: null,
    afterCarePlanOther: null,
    followUp: null,
  };
}

/** Ensure at least round 1 exists; sort ascending. */
export function normalizeTreatmentNotes(
  notes: TreatmentNoteLike[] | null | undefined
): TreatmentNoteDraft[] {
  const cleaned = (notes ?? [])
    .filter((n) => typeof n.round === "number" && n.round > 0)
    .map((n) => ({
      ...emptyTreatmentNote(n.round),
      ...n,
      unreachable: Boolean(n.unreachable),
      presentingTopics: Array.isArray(n.presentingTopics)
        ? n.presentingTopics
        : [],
      interventions: Array.isArray(n.interventions) ? n.interventions : [],
    }))
    .sort((a, b) => a.round - b.round);

  if (cleaned.length === 0) return [emptyTreatmentNote(1)];

  return cleaned;
}

/** Fill empty consult with case assignee key (user may still change it). */
export function applyDefaultConsult(
  notes: TreatmentNoteDraft[],
  defaultConsultId: string | null | undefined
): TreatmentNoteDraft[] {
  const id = defaultConsultId?.trim();

  if (!id) return notes;

  return notes.map((n) =>
    n.consult && String(n.consult).trim() !== "" ? n : { ...n, consult: id }
  );
}

export function nextTreatmentNoteRound(notes: TreatmentNoteDraft[]): number {
  if (notes.length === 0) return 1;

  return Math.max(...notes.map((n) => n.round)) + 1;
}

export function isNoteUnreachable(
  note: TreatmentNoteDraft | undefined
): boolean {
  return Boolean(note?.unreachable);
}

export function isNoteConsultComplete(
  note: TreatmentNoteDraft | undefined
): boolean {
  if (!note || isNoteUnreachable(note)) return false;

  return Boolean(
    note.scheduleTelemed &&
      note.serviceEndedAt &&
      note.consult &&
      String(note.consult).trim() !== ""
  );
}

export function isNoteUnreachableDocumented(
  note: TreatmentNoteDraft | undefined
): boolean {
  if (!note || !isNoteUnreachable(note)) return false;

  return Boolean(
    note.scheduleTelemed && note.consult && String(note.consult).trim() !== ""
  );
}

export function isNoteSoapComplete(
  note: TreatmentNoteDraft | undefined
): boolean {
  if (!note) return false;

  return isSoapFieldsComplete(note);
}

export function isNoteSessionReportComplete(
  note: TreatmentNoteDraft | undefined
): boolean {
  if (!note) return false;

  return isSessionReportComplete(note);
}

/** พบจริงครบ (consult+SOAP+session report) — รอบติดต่อไม่ได้ไม่นับ */
export function isNoteFollowUpComplete(
  note: TreatmentNoteDraft | undefined
): boolean {
  return (
    isNoteConsultComplete(note) &&
    isNoteSoapComplete(note) &&
    isNoteSessionReportComplete(note)
  );
}

/** รอบก่อนหน้าต้องบันทึกแล้ว (พบจริงครบ หรือติดต่อไม่ได้) ถึงจะเปิดรอบถัดไป */
export function canOpenNoteRound(
  notes: TreatmentNoteDraft[],
  round: number,
  savedConsultRounds?: Record<number, boolean>
): boolean {
  if (round <= 1) return true;

  const previous = notes
    .filter((n) => n.round < round)
    .sort((a, b) => b.round - a.round)[0];

  if (!previous) return false;

  if (savedConsultRounds) {
    return Boolean(savedConsultRounds[previous.round]);
  }

  return (
    isNoteFollowUpComplete(previous) || isNoteUnreachableDocumented(previous)
  );
}

export function toNotesApiPayload(
  note: TreatmentNoteDraft,
  kind: "consult" | "soap" = "soap"
) {
  const toIso = (value: Date | string | null | undefined) => {
    if (value == null || value === "") return null;
    if (value instanceof Date) return value.toISOString();

    const d = new Date(String(value));

    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  };

  return {
    kind,
    round: note.round,
    consult: note.consult ?? null,
    scheduleTelemed: toIso(note.scheduleTelemed),
    serviceEndedAt: toIso(note.serviceEndedAt),
    unreachable: Boolean(note.unreachable),
    subjective: note.subjective ?? null,
    objective: note.objective ?? null,
    assessment: note.assessment ?? null,
    plan: note.plan ?? null,
    note: note.note ?? null,
    sessionSelfHarmRisk:
      (note.sessionSelfHarmRisk as SessionSelfHarmRiskCode | null) ?? null,
    psychRisk: (note.psychRisk as PsychRiskSeverity | null) ?? null,
    presentingTopics: Array.isArray(note.presentingTopics)
      ? note.presentingTopics
      : [],
    presentingTopicsOther: note.presentingTopicsOther ?? null,
    interventions: Array.isArray(note.interventions) ? note.interventions : [],
    interventionsOther: note.interventionsOther ?? null,
    sessionOutcome: (note.sessionOutcome as SessionOutcomeCode | null) ?? null,
    afterCarePlan: (note.afterCarePlan as AfterCarePlanCode | null) ?? null,
    afterCarePlanOther: note.afterCarePlanOther ?? null,
    followUp: toIso(note.followUp),
  };
}

export { assertSessionReportForSoapSave };
