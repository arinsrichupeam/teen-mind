import type { QuestionsData } from "@/types";

import {
  calculateMainAssessmentResult,
  getMainSumFromQuestion,
  type MainAssessmentScale,
} from "@/lib/assessment-scale";
import { flattenTreatmentNotes, type TreatmentNoteLike } from "@/lib/case-flat";
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

function asArray<T = AnyRecord>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

/** Latest AssessmentRound first so legacy UIs reading `[0]` see tip scores. */
function sortRowsLatestFirst(rows: AnyRecord[]): AnyRecord[] {
  return [...rows].sort((a, b) => Number(b.round ?? 0) - Number(a.round ?? 0));
}

function pickQuestionnaireRows(caseRow: AnyRecord) {
  return {
    phqa: sortRowsLatestFirst(
      asArray<AnyRecord>(caseRow.questionsPhqa ?? caseRow.phqa)
    ),
    q2: sortRowsLatestFirst(
      asArray<AnyRecord>(caseRow.questions2Q ?? caseRow.q2)
    ),
    addon: sortRowsLatestFirst(
      asArray<AnyRecord>(caseRow.questionsPhqaAddon ?? caseRow.addon)
    ),
    q9: sortRowsLatestFirst(
      asArray<AnyRecord>(caseRow.questions9Q ?? caseRow.q9)
    ),
    q8: sortRowsLatestFirst(
      asArray<AnyRecord>(caseRow.questions8Q ?? caseRow.q8)
    ),
    problem: sortRowsLatestFirst(
      asArray<AnyRecord>(caseRow.questionsProblem ?? caseRow.problem)
    ),
  };
}

function resolveLegacyResult(
  caseRow: AnyRecord,
  scale: MainAssessmentScale
): {
  result: string;
  result_text: string;
} {
  const rows = pickQuestionnaireRows(caseRow);
  const q9Sum =
    rows.q9[0] && typeof (rows.q9[0] as { sum?: unknown }).sum === "number"
      ? (rows.q9[0] as { sum: number }).sum
      : null;
  const phqaSum =
    rows.phqa[0] && typeof (rows.phqa[0] as { sum?: unknown }).sum === "number"
      ? (rows.phqa[0] as { sum: number }).sum
      : null;
  const sum = getMainSumFromQuestion(q9Sum, phqaSum);

  if (sum != null) {
    const { result } = calculateMainAssessmentResult(sum, scale);

    return {
      result,
      result_text: getAssessmentResultLabel(result),
    };
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

function asNumberCoord(value: unknown): number | null {
  if (value == null || value === "") return null;
  if (
    typeof value === "object" &&
    value !== null &&
    "toNumber" in value &&
    typeof (value as { toNumber: () => number }).toNumber === "function"
  ) {
    const n = (value as { toNumber: () => number }).toNumber();

    return Number.isFinite(n) ? n : null;
  }
  const n = Number(value);

  return Number.isFinite(n) ? n : null;
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
    latitude: asNumberCoord(raw.latitude) ?? 0,
    longitude: asNumberCoord(raw.longitude) ?? 0,
    profile,
    referent: (raw.volunteer ??
      raw.referent ??
      null) as QuestionsData["referent"],
    referentId: (raw.volunteerId ?? raw.referentId ?? null) as number | null,
    close_case_reason: (raw.closeCaseReason ??
      raw.close_case_reason ??
      null) as string | null,
    hn: (profileRaw?.hn ?? raw.hn ?? null) as string,
    phqa: rows.phqa as unknown as QuestionsData["phqa"],
    q2: rows.q2 as unknown as QuestionsData["q2"],
    addon: rows.addon as unknown as QuestionsData["addon"],
    q9: rows.q9 as unknown as QuestionsData["q9"],
    q8: rows.q8 as unknown as QuestionsData["q8"],
    problem: rows.problem as unknown as QuestionsData["problem"],
    result: result as LegacyRiskColor | string,
    result_text,
  } as unknown as QuestionsData;

  // Closed CaseStatus / close reason must win over derived follow-up progress
  const rawCaseStatus = raw.status;

  if (
    rawCaseStatus === "CLOSED" ||
    (typeof mapped.close_case_reason === "string" &&
      mapped.close_case_reason.trim() !== "")
  ) {
    mapped.status = 3;
  } else {
    mapped.status = calculateQuestionStatus(mapped);
  }
  mapped.followUpRoundStatuses = getFollowUpRoundStatuses(mapped);
  mapped.caseStatus =
    typeof rawCaseStatus === "string" ? rawCaseStatus : undefined;

  const caseFacility = (raw.healthcareFacility ?? null) as {
    id?: string;
    name?: string;
  } | null;
  const caseFacilityId =
    (typeof raw.healthcareFacilityId === "string"
      ? raw.healthcareFacilityId
      : null) ??
    (typeof caseFacility?.id === "string" ? caseFacility.id : null);

  mapped.healthcareFacilityId = caseFacilityId;
  mapped.healthcareFacility =
    caseFacilityId && caseFacility?.name
      ? { id: caseFacilityId, name: String(caseFacility.name) }
      : null;

  const transferFacility = (raw.transferToFacility ?? null) as {
    id?: string;
    name?: string;
  } | null;
  const transferFacilityId =
    (typeof raw.transferToFacilityId === "string"
      ? raw.transferToFacilityId
      : null) ??
    (typeof transferFacility?.id === "string" ? transferFacility.id : null);

  mapped.transferToFacilityId = transferFacilityId;
  mapped.transferToFacility =
    transferFacilityId && transferFacility?.name
      ? { id: transferFacilityId, name: String(transferFacility.name) }
      : null;
  mapped.transferNote =
    (typeof raw.transferNote === "string" ? raw.transferNote : null) ?? null;
  mapped.transferRequestedAt =
    (raw.transferRequestedAt as string | Date | null | undefined) ?? null;
  mapped.transfers = asArray<AnyRecord>(raw.transfers).map((t) => ({
    id: String(t.id ?? ""),
    status: String(t.status ?? ""),
    requestNote: (t.requestNote as string | null | undefined) ?? null,
    responseNote: (t.responseNote as string | null | undefined) ?? null,
    requestedAt: (t.requestedAt as string | Date) ?? "",
    respondedAt: (t.respondedAt as string | Date | null | undefined) ?? null,
    fromFacility:
      (t.fromFacility as { id: string; name: string } | null | undefined) ??
      null,
    toFacility:
      (t.toFacility as { id: string; name: string } | null | undefined) ?? null,
  }));

  mapped.treatmentNotes = notes.map((n) => ({
    round: Number(n.round),
    consult: n.consult ?? null,
    scheduleTelemed: n.scheduleTelemed ?? null,
    serviceEndedAt: n.serviceEndedAt ?? null,
    unreachable: n.unreachable ?? false,
    subjective: n.subjective ?? null,
    objective: n.objective ?? null,
    assessment: n.assessment ?? null,
    plan: n.plan ?? null,
    note: n.note ?? null,
    sessionSelfHarmRisk: n.sessionSelfHarmRisk ?? null,
    psychRisk: n.psychRisk ?? null,
    presentingTopics: Array.isArray(n.presentingTopics)
      ? (n.presentingTopics as string[])
      : [],
    presentingTopicsOther: n.presentingTopicsOther ?? null,
    interventions: Array.isArray(n.interventions)
      ? (n.interventions as string[])
      : [],
    interventionsOther: n.interventionsOther ?? null,
    sessionOutcome: n.sessionOutcome ?? null,
    afterCarePlan: n.afterCarePlan ?? null,
    afterCarePlanOther: n.afterCarePlanOther ?? null,
    followUp: n.followUp ?? null,
  }));

  const assignee = (raw.assigneeAdmin ?? null) as AnyRecord | null;

  mapped.assigneeAdminId =
    (raw.assigneeAdminId as string | null | undefined) ??
    (assignee?.id as string | undefined) ??
    null;
  mapped.assigneeUserId =
    (assignee?.userId as string | null | undefined) ?? null;
  if (assignee) {
    const first = String(assignee.firstName ?? "").trim();
    const last = String(assignee.lastName ?? "").trim();
    const name = `${first} ${last}`.trim();

    mapped.assigneeName = name || null;
  } else {
    mapped.assigneeName = null;
  }

  return mapped;
}

export function toLegacyQuestionList(cases: unknown[]): QuestionsData[] {
  return cases.map((row) => toLegacyQuestionRow(row));
}
