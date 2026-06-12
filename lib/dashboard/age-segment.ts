import {
  MAIN_ASSESSMENT_AGE_CUTOFF,
  getMainAssessmentScaleFromAge,
} from "@/lib/assessment-scale";
import {
  calculateAge,
  getNineQRiskLevel,
  getPhqaRiskLevel,
} from "@/utils/helper";

export type RiskCounts = {
  green: number;
  greenLow: number;
  yellow: number;
  orange: number;
  red: number;
};

export type RiskByAgeGroup = RiskCounts & { totalUsers: number };

export type AgeSegmentStats = {
  label: string | null;
  totalRecipients: number;
  ageUnder18: number;
  age18AndOver: number;
  ageUnspecified: number;
  riskAgeUnder18: RiskByAgeGroup;
  riskAge18AndOver: RiskByAgeGroup;
};

export function getRiskCounts(result: string): RiskCounts {
  switch (result) {
    case "Green":
      return { green: 1, greenLow: 0, yellow: 0, orange: 0, red: 0 };
    case "Green-Low":
      return { green: 0, greenLow: 1, yellow: 0, orange: 0, red: 0 };
    case "Yellow":
      return { green: 0, greenLow: 0, yellow: 1, orange: 0, red: 0 };
    case "Orange":
      return { green: 0, greenLow: 0, yellow: 0, orange: 1, red: 0 };
    case "Red":
      return { green: 0, greenLow: 0, yellow: 0, orange: 0, red: 1 };
    default:
      return { green: 0, greenLow: 0, yellow: 0, orange: 0, red: 0 };
  }
}

const emptyRiskByAge = (): RiskByAgeGroup => ({
  green: 0,
  greenLow: 0,
  yellow: 0,
  orange: 0,
  red: 0,
  totalUsers: 0,
});

export type AgeSegmentRow = {
  birthday: Date;
  screeningDate: Date | null;
  questionCreatedAt: Date;
  result: string;
  /** คะแนนรวมจาก 9Q หรือ PHQ-A (สเกล 0–27 เหมือนกัน) */
  mainSum: number | null;
};

function getAgeYears(row: AgeSegmentRow): number | null {
  if (!row.birthday) return null;

  const targetDate = row.screeningDate ?? row.questionCreatedAt;

  return calculateAge(row.birthday.toISOString(), targetDate);
}

function addRisk(target: RiskByAgeGroup, result: string) {
  const c = getRiskCounts(result);

  target.green += c.green;
  target.greenLow += c.greenLow;
  target.yellow += c.yellow;
  target.orange += c.orange;
  target.red += c.red;
  target.totalUsers += 1;
}

/** เกณฑ์ 9Q ไม่มี Green-Low — รวมเข้า Green หากพบในข้อมูล */
function addRiskNineQ(target: RiskByAgeGroup, result: string) {
  const normalized = result === "Green-Low" ? "Green" : result;

  addRisk(target, normalized);
}

function addRiskFromMainSum(
  target: RiskByAgeGroup,
  age: number,
  mainSum: number | null
) {
  if (mainSum === null || Number.isNaN(mainSum)) return;

  const scale = getMainAssessmentScaleFromAge(age);
  const result =
    scale === "9Q" ? getNineQRiskLevel(mainSum) : getPhqaRiskLevel(mainSum);

  if (scale === "9Q") {
    addRiskNineQ(target, result);
  } else {
    addRisk(target, result);
  }
}

export function computeAgeSegmentStats(
  rows: AgeSegmentRow[],
  label: string | null
): AgeSegmentStats {
  const riskAgeUnder18 = emptyRiskByAge();
  const riskAge18AndOver = emptyRiskByAge();
  let ageUnder18 = 0;
  let age18AndOver = 0;
  let ageUnspecified = 0;

  for (const row of rows) {
    const age = getAgeYears(row);

    if (age === null) {
      ageUnspecified += 1;
      continue;
    }

    if (age < MAIN_ASSESSMENT_AGE_CUTOFF) {
      ageUnder18 += 1;
      addRiskFromMainSum(riskAgeUnder18, age, row.mainSum);
    } else {
      age18AndOver += 1;
      addRiskFromMainSum(riskAge18AndOver, age, row.mainSum);
    }
  }

  return {
    label,
    totalRecipients: rows.length,
    ageUnder18,
    age18AndOver,
    ageUnspecified,
    riskAgeUnder18,
    riskAge18AndOver,
  };
}

export const emptyAgeSegmentStats = (
  label: string | null
): AgeSegmentStats => ({
  label,
  totalRecipients: 0,
  ageUnder18: 0,
  age18AndOver: 0,
  ageUnspecified: 0,
  riskAgeUnder18: emptyRiskByAge(),
  riskAge18AndOver: emptyRiskByAge(),
});
