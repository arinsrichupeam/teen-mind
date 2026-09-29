import type { QuestionsData } from "@/types";

type RowWithRound = { round?: number | null };

function rowRound(row: unknown): number | null {
  if (!row || typeof row !== "object") return null;

  const value = (row as RowWithRound).round;

  return typeof value === "number" && value > 0 ? value : null;
}

function collectRoundsFromRows(rows: unknown[] | undefined, into: Set<number>) {
  for (const row of rows ?? []) {
    const round = rowRound(row);

    if (round != null) into.add(round);
  }
}

/** รายการหมายเลข AssessmentRound ที่มีแบบประเมินในเคส (เรียงน้อย→มาก) */
export function listAssessmentRoundsFromQuestion(
  data: QuestionsData | undefined | null
): number[] {
  if (!data) return [];

  const rounds = new Set<number>();

  collectRoundsFromRows(data.q2, rounds);
  collectRoundsFromRows(data.q9, rounds);
  collectRoundsFromRows(data.phqa, rounds);
  collectRoundsFromRows(data.q8, rounds);
  collectRoundsFromRows(data.addon, rounds);
  collectRoundsFromRows(data.problem, rounds);

  if (rounds.size > 0) {
    return Array.from(rounds).sort((a, b) => a - b);
  }

  const hasAny =
    (data.q2?.length ?? 0) > 0 ||
    (data.q9?.length ?? 0) > 0 ||
    (data.phqa?.length ?? 0) > 0 ||
    (data.q8?.length ?? 0) > 0 ||
    (data.addon?.length ?? 0) > 0 ||
    (data.problem?.length ?? 0) > 0;

  return hasAny ? [1] : [];
}

function filterRowsForRound<T>(
  rows: T[] | undefined,
  round: number,
  allowLegacyWithoutRound: boolean
): T[] {
  const list = rows ?? [];
  const matched = list.filter((row) => rowRound(row) === round);

  if (matched.length > 0) return matched;

  if (!allowLegacyWithoutRound) return [];

  return list.filter((row) => rowRound(row) == null);
}

/**
 * คัดเฉพาะแถวแบบประเมินของรอบที่เลือก — ให้ UI ที่อ่าน `[0]` เห็นรอบนั้น
 */
export function filterQuestionByAssessmentRound(
  data: QuestionsData,
  round: number
): QuestionsData {
  const available = listAssessmentRoundsFromQuestion(data);
  const allowLegacyWithoutRound =
    available.length <= 1 || (available.length === 1 && available[0] === round);

  return {
    ...data,
    q2: filterRowsForRound(data.q2, round, allowLegacyWithoutRound),
    q9: filterRowsForRound(data.q9, round, allowLegacyWithoutRound),
    phqa: filterRowsForRound(data.phqa, round, allowLegacyWithoutRound),
    q8: filterRowsForRound(data.q8, round, allowLegacyWithoutRound),
    addon: filterRowsForRound(data.addon, round, allowLegacyWithoutRound),
    problem: filterRowsForRound(data.problem, round, allowLegacyWithoutRound),
  };
}
