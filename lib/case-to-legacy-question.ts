import type { QuestionsData } from "@/types";

import {
  calculateMainAssessmentResult,
  getMainSumFromQuestion,
  type MainAssessmentScale,
} from "@/lib/assessment-scale";
import {
  flattenTreatmentNotes,
  type TreatmentNoteLike,
} from "@/lib/case-flat";
import {
  mapScreeningResultToLegacyColor,
  type LegacyRiskColor,
} from "@/lib/legacy-value-mapping";
import {
  calculateQuestionStatus,
  getFollowUpRoundStatuses,
} from "@/lib/question-followup-rounds";
import { getAssessmentResultLabel } from "@/lib/assessment-result-colors";

type AnyRecord = Record<string, unknown>;

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function pickQuestionnaireRows(caseRow: AnyRecord) {
  return {
    phqa: asArray(caseRow.questionsPhqa ?? caseRow.phqa),
    q2: asArray(caseRow.questions2Q ?? caseRow.q2),
    addon: asArray(caseRow.questionsPhqaAddon ?? caseRow.addon),
    q9: asArray(caseRow.questions9Q ?? caseRow.q9),
    q8: asArray(caseRow.questions8Q ?? caseRow.q8),
    problem: asArray(caseRow.questionsProblem ?? caseRow.problem),
  };
}

function resolveLegacyResult(caseRow: AnyRecord, scale: MainAssessmentScale): {
  result: string;
  result_text: string;
} {
  const rows = pickQuestionnaireRows(caseRow);
  const q9Sum =
    rows.q9[0] && typeof (rows.q9[0] as { sum?: unknown }).sum === "number"
      ? ((rows.q9[0] as { sum: number }).sum)
      : null;
  const phqaSum =
    rows.phqa[0] && typeof (rows.phqa[0] as { sum?: unknown }).sum === "number"
      ? ((rows.phqa[0] as { sum: number }).sum)
      : null;
  const sum = getMainSumFromQuestion(q9Sum, phqaSum);

  if (sum != null) {
    return calculateMainAssessmentResult(sum, scale);
  }

  const color =
    mapScreeningResultToLegacyColor(
      caseRow.result as string | null | undefined
    ) || "";

  return {
    result: color,
    result_text: color ? getAssessmentResultLabel(color) : "",
  };
}

/**
 * Map Prisma Case (+ relations) → legacy QuestionsData shape used by admin LIFF UIs.
 * Aliases: questionsPhqa→phqa, questions2Q→q2, ScreeningResult→Green/…, derived status 0–3.
 */
export function toLegacyQuestionRow(caseRow: unknown): QuestionsData {
  const raw = (caseRow ?? {}) as AnyRecord;
  const notes = asArray<TreatmentNoteLike>(raw.treatmentNotes);
  const flat = flattenTreatmentNotes(notes);
  const rows = pickQuestionnaireRows(raw);

  const profileRaw = (raw.profile ?? null) as AnyRecord | null;
  const profile = profileRaw
    ? {
        ...profileRaw,
        address: asArray(profileRaw.addresses ?? profileRaw.address),
        emergency: asArray(
          profileRaw.emergencyContacts ?? profileRaw.emergency
        ),
        birthday: profileRaw.birthDate ?? profileRaw.birthday ?? null,
      }
    : (null as unknown as QuestionsData["profile"]);

  const hasQ9 = rows.q9.length > 0;
  const scale: MainAssessmentScale = hasQ9 ? "9Q" : "PHQA";
  const { result, result_text } = resolveLegacyResult(raw, scale);

  const mapped = {
    ...raw,
    ...flat,
    profile,
    referent: (raw.volunteer ?? raw.referent ?? null) as QuestionsData["referent"],
    referentId: (raw.volunteerId ?? raw.referentId ?? null) as
      | number
      | null,
    close_case_reason:
      (raw.closeCaseReason ?? raw.close_case_reason ?? null) as string | null,
    hn: (profileRaw?.hn ?? raw.hn ?? null) as string,
    phqa: rows.phqa as QuestionsData["phqa"],
    q2: rows.q2 as QuestionsData["q2"],
    addon: rows.addon as QuestionsData["addon"],
    q9: rows.q9 as QuestionsData["q9"],
    q8: rows.q8 as QuestionsData["q8"],
    problem: rows.problem as QuestionsData["problem"],
    result: result as LegacyRiskColor | string,
    result_text,
  } as unknown as QuestionsData;

  mapped.status = calculateQuestionStatus(mapped);
  mapped.followUpRoundStatuses = getFollowUpRoundStatuses(mapped);

  return mapped;
}

export function toLegacyQuestionList(cases: unknown[]): QuestionsData[] {
  return cases.map((row) => toLegacyQuestionRow(row));
}
