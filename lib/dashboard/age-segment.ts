import { calculateAge, getNineQRiskLevel } from "@/utils/helper";

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
  age12to18: number;
  ageOver18: number;
  ageUnder12: number;
  ageUnspecified: number;
  riskAge12to18: RiskByAgeGroup;
  riskAgeOver18: RiskByAgeGroup;
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

export function computeAgeSegmentStats(
  rows: AgeSegmentRow[],
  label: string | null
): AgeSegmentStats {
  const riskAge12to18 = emptyRiskByAge();
  const riskAgeOver18 = emptyRiskByAge();
  let age12to18 = 0;
  let ageOver18 = 0;
  let ageUnder12 = 0;
  let ageUnspecified = 0;

  for (const row of rows) {
    const age = getAgeYears(row);

    if (age === null) {
      ageUnspecified += 1;
      continue;
    }

    if (age < 12) {
      ageUnder12 += 1;
    } else if (age >= 12 && age <= 18) {
      age12to18 += 1;
      addRisk(riskAge12to18, row.result);
    } else if (age > 18) {
      ageOver18 += 1;
      if (row.mainSum !== null && !Number.isNaN(row.mainSum)) {
        addRiskNineQ(riskAgeOver18, getNineQRiskLevel(row.mainSum));
      }
    }
  }

  return {
    label,
    totalRecipients: rows.length,
    age12to18,
    ageOver18,
    ageUnder12,
    ageUnspecified,
    riskAge12to18,
    riskAgeOver18,
  };
}

export const emptyAgeSegmentStats = (
  label: string | null
): AgeSegmentStats => ({
  label,
  totalRecipients: 0,
  age12to18: 0,
  ageOver18: 0,
  ageUnder12: 0,
  ageUnspecified: 0,
  riskAge12to18: emptyRiskByAge(),
  riskAgeOver18: emptyRiskByAge(),
});
