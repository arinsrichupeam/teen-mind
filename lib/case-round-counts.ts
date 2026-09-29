import type { QuestionsData } from "@/types";

import { listAssessmentRoundsFromQuestion } from "@/lib/question-assessment-rounds";
import {
  isNoteConsultComplete,
  isNoteSoapComplete,
  isNoteUnreachableDocumented,
  type TreatmentNoteDraft,
} from "@/lib/treatment-note-rounds";

/** จำนวนรอบประเมิน (AssessmentRound) ที่มีแบบประเมินในเคส */
export function countAssessmentRounds(row: QuestionsData): number {
  return listAssessmentRoundsFromQuestion(row).length;
}

function noteHasContent(note: {
  consult?: string | null;
  scheduleTelemed?: Date | string | null;
  unreachable?: boolean | null;
  subjective?: string | null;
  objective?: string | null;
  assessment?: string | null;
  plan?: string | null;
  note?: string | null;
  followUp?: Date | string | null;
}): boolean {
  return Boolean(
    note.consult ||
      note.scheduleTelemed ||
      note.unreachable ||
      note.subjective ||
      note.objective ||
      note.assessment ||
      note.plan ||
      note.note ||
      note.followUp
  );
}

function flatRoundDraft(
  row: QuestionsData,
  round: 1 | 2 | 3
): TreatmentNoteDraft {
  const suffix = round === 1 ? "" : String(round);

  return {
    round,
    consult: (row[`consult${suffix}` as keyof QuestionsData] as string) ?? null,
    scheduleTelemed:
      (row[`schedule_telemed${suffix}` as keyof QuestionsData] as
        | Date
        | string
        | null) ?? null,
    unreachable: Boolean(row[`unreachable${suffix}` as keyof QuestionsData]),
    subjective:
      (row[`subjective${suffix}` as keyof QuestionsData] as string) ?? null,
    objective:
      (row[`objective${suffix}` as keyof QuestionsData] as string) ?? null,
    assessment:
      (row[`assessment${suffix}` as keyof QuestionsData] as string) ?? null,
    plan: (row[`plan${suffix}` as keyof QuestionsData] as string) ?? null,
    note: (row[`note${suffix}` as keyof QuestionsData] as string) ?? null,
    followUp:
      (row[`follow_up${suffix}` as keyof QuestionsData] as
        | Date
        | string
        | null) ?? null,
  };
}

/** นับรอบคำปรึกษาจาก TreatmentNote โดยตรง (API list / summary) */
export function countConsultRoundsFromNotes(
  notes: Array<{
    round?: number | null;
    consult?: string | null;
    scheduleTelemed?: Date | string | null;
    unreachable?: boolean | null;
    subjective?: string | null;
    objective?: string | null;
    assessment?: string | null;
    plan?: string | null;
    note?: string | null;
    followUp?: Date | string | null;
  }>
): number {
  return new Set(notes.filter(noteHasContent).map((n) => Number(n.round))).size;
}

/** จำนวนรอบบันทึกการให้คำปรึกษาที่มีเนื้อหา */
export function countConsultRounds(row: QuestionsData): number {
  const notes = row.treatmentNotes ?? [];

  if (notes.length > 0) {
    return countConsultRoundsFromNotes(notes);
  }

  let count = 0;

  for (const round of [1, 2, 3] as const) {
    const draft = flatRoundDraft(row, round);

    if (
      noteHasContent(draft) ||
      isNoteConsultComplete(draft) ||
      isNoteUnreachableDocumented(draft) ||
      isNoteSoapComplete(draft)
    ) {
      count += 1;
    }
  }

  return count;
}
