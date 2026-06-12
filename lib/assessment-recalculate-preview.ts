import type { Questions_9Q, Questions_PHQA } from "@prisma/client";

import {
  MAIN_ASSESSMENT_AGE_CUTOFF,
  calculateMainAssessmentResult,
  detectAssessmentMismatch,
  getAgeAtAssessment,
  getMainAssessmentScaleFromAge,
  type AssessmentMismatchIssue,
} from "@/lib/assessment-scale";

type QuestionRow = {
  id: string;
  profileId: string;
  result: string | null;
  status: number;
  createdAt: Date;
  phqa: Questions_PHQA[];
  q9: Questions_9Q[];
  addon: { id: string | number }[];
  profile: {
    birthday: Date | null;
    school: { screeningDate: Date | null } | null;
  } | null;
};

export type RecalculatePreviewMismatch = {
  questionId: string;
  profileId: string;
  age: number | null;
  issue: AssessmentMismatchIssue;
  previousResult: string;
  expectedResult: string;
};

export type RecalculatePreviewStats = {
  totalQuestions: number;
  mismatchSummary: {
    wrongScale: number;
    missingAddon: number;
    missingAge: number;
    total: number;
  };
  ageBreakdown: {
    under18: number;
    age18AndOver: number;
    unspecified: number;
  };
  scaleByStructure: {
    nineq: number;
    phqa: number;
  };
  scaleByAge: {
    phqa: number;
    nineq: number;
  };
  resultWouldChange: number;
  resultStats: { result: string; count: number }[];
  statusStats: { status: number; count: number }[];
};

function calculateSum(row: Questions_PHQA) {
  return (
    row.q1 +
    row.q2 +
    row.q3 +
    row.q4 +
    row.q5 +
    row.q6 +
    row.q7 +
    row.q8 +
    row.q9
  );
}

export function buildRecalculatePreview(
  questions: QuestionRow[]
): RecalculatePreviewStats {
  const mismatchSummary = {
    wrongScale: 0,
    missingAddon: 0,
    missingAge: 0,
    total: 0,
  };
  const ageBreakdown = {
    under18: 0,
    age18AndOver: 0,
    unspecified: 0,
  };
  const scaleByStructure = { nineq: 0, phqa: 0 };
  const scaleByAge = { phqa: 0, nineq: 0 };
  const resultCounts = new Map<string, number>();
  const statusCounts = new Map<number, number>();
  let resultWouldChange = 0;

  for (const question of questions) {
    if (!question.phqa || question.phqa.length === 0) continue;

    const hasQ9Row = Array.isArray(question.q9) && question.q9.length > 0;
    const hasPhqaAddon =
      Array.isArray(question.addon) && question.addon.length > 0;

    if (hasQ9Row) scaleByStructure.nineq += 1;
    else scaleByStructure.phqa += 1;

    const age = getAgeAtAssessment(
      question.profile?.birthday,
      question.profile?.school?.screeningDate,
      question.createdAt
    );

    if (age === null) {
      ageBreakdown.unspecified += 1;
    } else if (age < MAIN_ASSESSMENT_AGE_CUTOFF) {
      ageBreakdown.under18 += 1;
      scaleByAge.phqa += 1;
    } else {
      ageBreakdown.age18AndOver += 1;
      scaleByAge.nineq += 1;
    }

    const issue = detectAssessmentMismatch(age, hasQ9Row, hasPhqaAddon);

    if (issue === "wrong_scale_for_age") mismatchSummary.wrongScale += 1;
    if (issue === "missing_addon") mismatchSummary.missingAddon += 1;
    if (issue === "missing_age") mismatchSummary.missingAge += 1;
    if (issue !== "ok") mismatchSummary.total += 1;

    const sourceData = hasQ9Row ? question.q9[0] : question.phqa[0];
    const sum = calculateSum(sourceData);
    const scale =
      age !== null
        ? getMainAssessmentScaleFromAge(age)
        : hasQ9Row
          ? "9Q"
          : "PHQA";
    const { result: expectedResult } = calculateMainAssessmentResult(
      sum,
      scale
    );
    const previousResult = question.result ?? "";

    if (previousResult !== expectedResult) {
      resultWouldChange += 1;
    }

    resultCounts.set(
      previousResult || "(ว่าง)",
      (resultCounts.get(previousResult || "(ว่าง)") ?? 0) + 1
    );

    statusCounts.set(
      question.status,
      (statusCounts.get(question.status) ?? 0) + 1
    );
  }

  return {
    totalQuestions: questions.length,
    mismatchSummary,
    ageBreakdown,
    scaleByStructure,
    scaleByAge,
    resultWouldChange,
    resultStats: Array.from(resultCounts.entries()).map(([result, count]) => ({
      result,
      count,
    })),
    statusStats: Array.from(statusCounts.entries()).map(([status, count]) => ({
      status,
      count,
    })),
  };
}

export function listRecalculateMismatches(
  questions: QuestionRow[]
): RecalculatePreviewMismatch[] {
  const mismatches: RecalculatePreviewMismatch[] = [];

  for (const question of questions) {
    if (!question.phqa || question.phqa.length === 0) continue;

    const hasQ9Row = Array.isArray(question.q9) && question.q9.length > 0;
    const hasPhqaAddon =
      Array.isArray(question.addon) && question.addon.length > 0;

    const age = getAgeAtAssessment(
      question.profile?.birthday,
      question.profile?.school?.screeningDate,
      question.createdAt
    );

    const issue = detectAssessmentMismatch(age, hasQ9Row, hasPhqaAddon);

    if (issue === "ok") continue;

    const sourceData = hasQ9Row ? question.q9[0] : question.phqa[0];
    const sum = calculateSum(sourceData);
    const scale =
      age !== null
        ? getMainAssessmentScaleFromAge(age)
        : hasQ9Row
          ? "9Q"
          : "PHQA";
    const { result: expectedResult } = calculateMainAssessmentResult(
      sum,
      scale
    );

    mismatches.push({
      questionId: question.id,
      profileId: question.profileId,
      age,
      issue,
      previousResult: question.result ?? "",
      expectedResult,
    });
  }

  return mismatches;
}
