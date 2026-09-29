import type { TreatmentNoteLike } from "@/lib/case-flat";

function toDateOrNull(value: unknown): Date | null {
  if (value == null || value === "") return null;

  const d = value instanceof Date ? value : new Date(String(value));

  return Number.isNaN(d.getTime()) ? null : d;
}

function toStrOrNull(value: unknown): string | null {
  if (value == null) return null;

  const s = String(value).trim();

  return s === "" ? null : s;
}

function toBool(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "true";
}

export type TreatmentNoteUpsertPayload = TreatmentNoteLike & {
  round: 1 | 2 | 3;
};

function roundHasContent(note: TreatmentNoteUpsertPayload): boolean {
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

/**
 * Expand legacy flat consult/SOAP fields → TreatmentNote rows (rounds 1–3).
 * Only returns rounds that have at least one field set.
 */
export function extractTreatmentNotesFromLegacyFlat(
  flat: Record<string, unknown>
): TreatmentNoteUpsertPayload[] {
  const notes: TreatmentNoteUpsertPayload[] = [];

  for (const round of [1, 2, 3] as const) {
    const suffix = round === 1 ? "" : String(round);
    const note: TreatmentNoteUpsertPayload = {
      round,
      consult: toStrOrNull(flat[`consult${suffix}`]),
      scheduleTelemed: toDateOrNull(flat[`schedule_telemed${suffix}`]),
      unreachable: toBool(flat[`unreachable${suffix}`]),
      subjective: toStrOrNull(flat[`subjective${suffix}`]),
      objective: toStrOrNull(flat[`objective${suffix}`]),
      assessment: toStrOrNull(flat[`assessment${suffix}`]),
      plan: toStrOrNull(flat[`plan${suffix}`]),
      note: toStrOrNull(flat[`note${suffix}`]),
      followUp: toDateOrNull(flat[`follow_up${suffix}`]),
    };

    if (roundHasContent(note)) {
      notes.push(note);
    }
  }

  return notes;
}
