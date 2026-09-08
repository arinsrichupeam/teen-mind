/**
 * Flatten TreatmentNote[] into the legacy Questions_Master consult/schedule shape
 * used by QuestionLike / follow-up helpers.
 *
 * Round 1 → consult, schedule_telemed, subjective, …
 * Round 2 → consult2, schedule_telemed2, …
 * Round 3 → consult3, schedule_telemed3, …
 */
export type TreatmentNoteLike = {
  round: number;
  consult?: string | null;
  scheduleTelemed?: Date | null;
  unreachable?: boolean | null;
  subjective?: string | null;
  objective?: string | null;
  assessment?: string | null;
  plan?: string | null;
  note?: string | null;
  followUp?: Date | null;
};

export function flattenTreatmentNotes(
  notes: TreatmentNoteLike[] | null | undefined
): Record<string, unknown> {
  const flat: Record<string, unknown> = {
    consult: null,
    consult2: null,
    consult3: null,
    schedule_telemed: null,
    schedule_telemed2: null,
    schedule_telemed3: null,
    unreachable: null,
    unreachable2: null,
    unreachable3: null,
    subjective: null,
    subjective2: null,
    subjective3: null,
    objective: null,
    objective2: null,
    objective3: null,
    assessment: null,
    assessment2: null,
    assessment3: null,
    plan: null,
    plan2: null,
    plan3: null,
    note: null,
    note2: null,
    note3: null,
    follow_up: null,
    follow_up2: null,
    follow_up3: null,
  };

  if (!notes?.length) return flat;

  for (const note of notes) {
    const suffix = note.round === 1 ? "" : String(note.round);

    flat[`consult${suffix}`] = note.consult ?? null;
    flat[`schedule_telemed${suffix}`] = note.scheduleTelemed ?? null;
    flat[`unreachable${suffix}`] = note.unreachable ?? null;
    flat[`subjective${suffix}`] = note.subjective ?? null;
    flat[`objective${suffix}`] = note.objective ?? null;
    flat[`assessment${suffix}`] = note.assessment ?? null;
    flat[`plan${suffix}`] = note.plan ?? null;
    flat[`note${suffix}`] = note.note ?? null;
    flat[`follow_up${suffix}`] = note.followUp ?? null;
  }

  return flat;
}
