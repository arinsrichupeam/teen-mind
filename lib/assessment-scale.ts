import {
  getNineQRiskLevel,
  getNineQRiskText,
  getPhqaRiskLevel,
  getPhqaRiskText,
  calculateAge,
} from "@/utils/helper";

export const MAIN_ASSESSMENT_AGE_CUTOFF = 18;

export type MainAssessmentScale = "PHQA" | "9Q";
export type AssessmentFlowGroup = "phqa" | "nineq";

export type AssessmentMismatchIssue =
  | "ok"
  | "wrong_scale_for_age"
  | "missing_addon"
  | "missing_age";

export function getMainAssessmentScaleFromAge(
  age: number
): MainAssessmentScale {
  return age < MAIN_ASSESSMENT_AGE_CUTOFF ? "PHQA" : "9Q";
}

export function getAssessmentFlowGroupFromAge(
  age: number
): AssessmentFlowGroup {
  return age < MAIN_ASSESSMENT_AGE_CUTOFF ? "phqa" : "nineq";
}

export function getAgeAtAssessment(
  birthday: Date | string | null | undefined,
  screeningDate?: Date | string | null,
  fallbackDate?: Date | string | null
): number | null {
  if (!birthday) return null;

  const target = screeningDate ?? fallbackDate ?? new Date();
  const age = calculateAge(
    birthday instanceof Date ? birthday.toISOString() : String(birthday),
    target instanceof Date ? target : target
  );

  return age;
}

export function getMainSumFromQuestion(
  q9Sum?: number | null,
  phqaSum?: number | null
): number | null {
  if (typeof q9Sum === "number" && !Number.isNaN(q9Sum)) {
    return q9Sum;
  }

  if (typeof phqaSum === "number" && !Number.isNaN(phqaSum)) {
    return phqaSum;
  }

  return null;
}

export function calculateMainAssessmentResult(
  sum: number,
  scale: MainAssessmentScale
): { result: string; result_text: string } {
  const result =
    scale === "9Q" ? getNineQRiskLevel(sum) : getPhqaRiskLevel(sum);
  const result_text =
    scale === "9Q" ? getNineQRiskText(sum) : getPhqaRiskText(sum);

  return { result, result_text };
}

export function detectAssessmentMismatch(
  age: number | null,
  hasQ9Row: boolean,
  hasPhqaAddon: boolean
): AssessmentMismatchIssue {
  if (age === null) {
    return "missing_age";
  }

  const expectedScale = getMainAssessmentScaleFromAge(age);
  const hasWrongScale =
    (expectedScale === "PHQA" && hasQ9Row) ||
    (expectedScale === "9Q" && !hasQ9Row);

  if (hasWrongScale) {
    return "wrong_scale_for_age";
  }

  if (expectedScale === "PHQA" && !hasPhqaAddon) {
    return "missing_addon";
  }

  return "ok";
}
