import type { MainAssessmentScale } from "./assessment-scale";

import { shouldEnter8Q } from "./depression-flow";
import { sum9Q, sumPhqa } from "./assessment-scoring";

export const PROBLEM_KEYS = [
  "familyRelation",
  "familyStudyPressure",
  "familyConflict",
  "familyAbuse",
  "familyLoss",
  "socialFriendIssue",
  "socialBullying",
  "socialBreakup",
  "socialTeacher",
  "socialAssault",
  "studyStress",
  "studyNoMotivation",
  "studyBurnout",
  "studyTimeManage",
  "studyHomeworkLoad",
  "studyExamAnxiety",
  "financeFamilyIssue",
  "lifestyleSocialMediaOveruse",
  "lifestyleGamingAddiction",
  "lifestyleSubstanceUse",
  "lifestyleEatingIssue",
  "lifestyleBodyImageConcern",
  "lifestyleInsomnia",
] as const;

export type ProblemKey = (typeof PROBLEM_KEYS)[number];

export function problemKeys(): readonly ProblemKey[] {
  return PROBLEM_KEYS;
}

export function sumProblem(problem: Record<string, number>): number {
  return PROBLEM_KEYS.reduce((acc, key) => acc + Number(problem[key] === 1), 0);
}

export function validateProblem(problem?: Record<string, number>): void {
  if (!problem) return;
  for (const key of PROBLEM_KEYS) {
    const value = Number(problem[key] ?? 0);

    if (value !== 0 && value !== 1) {
      throw new Error(`ค่าประเมินปัญหา ${key} ไม่ถูกต้อง`);
    }
  }
}

type TwoQPayload = { q1: number; q2: number };

type EightQPayload = {
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  q5: number;
  q6: number;
  q7: number;
  q8: number;
  q8Addon: number;
};

type MainNinePayload = {
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  q5: number;
  q6: number;
  q7: number;
  q8: number;
  q9: number;
};

export type AssessmentPayloadInput = {
  profileId?: string;
  Q2?: TwoQPayload;
  q9?: MainNinePayload;
  phqa?: MainNinePayload;
  phqaAddon?: { q1: number; q2: number };
  q8?: EightQPayload;
  problem?: Record<string, number>;
};

/**
 * Validates depression assessment create/continue payload.
 * Throws Error with Thai message on invalid input (same contract as former route helper).
 */
export function validateAssessmentPayload(
  data: AssessmentPayloadInput,
  expectedScale: MainAssessmentScale,
  twoQPositive: boolean
): void {
  if (!data.profileId) throw new Error("ข้อมูลไม่ครบถ้วน: profileId");
  if (!data.Q2) throw new Error("ข้อมูลไม่ครบถ้วน: Q2");
  validateProblem(data.problem);

  if (data.Q2.q1 !== 0 && data.Q2.q1 !== 1) {
    throw new Error("ค่า 2Q q1 ไม่ถูกต้อง");
  }
  if (data.Q2.q2 !== 0 && data.Q2.q2 !== 1) {
    throw new Error("ค่า 2Q q2 ไม่ถูกต้อง");
  }

  if (!twoQPositive) {
    return;
  }

  const validate8Q = () => {
    if (!data.q8) throw new Error("ข้อมูลไม่ครบถ้วน: q8");

    const q8 = data.q8;
    const allowedQ8 = {
      q1: [0, 1],
      q2: [0, 2],
      q3: [0, 6],
      q4: [0, 8],
      q5: [0, 9],
      q6: [0, 5],
      q7: [0, 10],
      q8: [0, 4],
      q8Addon: [0, 8],
    };

    const checkAllowed = (key: keyof typeof allowedQ8, value: number) => {
      const numeric = Number(value);
      const ok = allowedQ8[key].includes(numeric);

      if (!ok) throw new Error(`ค่า 8Q ${String(key)} ไม่ถูกต้อง`);
    };

    checkAllowed("q1", q8.q1);
    checkAllowed("q2", q8.q2);
    checkAllowed("q3", q8.q3);
    checkAllowed("q4", q8.q4);
    checkAllowed("q5", q8.q5);
    checkAllowed("q6", q8.q6);
    checkAllowed("q7", q8.q7);
    checkAllowed("q8", q8.q8);

    if (q8.q3 === 6 || Number(q8.q3) === 6) {
      checkAllowed("q8Addon", q8.q8Addon);
    } else if (Number(q8.q8Addon) !== 0) {
      throw new Error("ค่า 8Q q8Addon ไม่ถูกต้องเมื่อ q3 ไม่ใช่");
    }
  };

  if (expectedScale === "9Q") {
    if (!data.q9) {
      throw new Error("ข้อมูลไม่ครบถ้วนสำหรับ 9Q (อายุ 18 ปีขึ้นไป)");
    }

    const q9 = data.q9;

    for (let i = 1; i <= 9; i++) {
      const key = `q${i}` as keyof typeof q9;
      const value = q9[key] as unknown as number;

      if (value == null || value < 0 || value > 3) {
        throw new Error(`ค่า 9Q q${i} ไม่ถูกต้อง`);
      }
    }

    if (shouldEnter8Q("9Q", sum9Q(q9))) {
      validate8Q();
    }

    return;
  }

  if (data.q9) {
    throw new Error(
      "ไม่ควรมีข้อมูล 9Q สำหรับอายุต่ำกว่า 18 ปี (ใช้ PHQ-A + Addon)"
    );
  }

  if (!data.phqa || !data.phqaAddon) {
    throw new Error(
      "ข้อมูลไม่ครบถ้วนสำหรับ PHQ-A (อายุต่ำกว่า 18 ปี): phqa/phqaAddon"
    );
  }

  for (let i = 1; i <= 9; i++) {
    const key = `q${i}` as keyof typeof data.phqa;
    const value = data.phqa[key] as unknown as number;

    if (value == null || value < 0 || value > 3) {
      throw new Error(`ค่า PHQA q${i} ไม่ถูกต้อง`);
    }
  }

  if (data.phqaAddon.q1 !== 0 && data.phqaAddon.q1 !== 1) {
    throw new Error("ค่า PHQA Addon q1 ไม่ถูกต้อง");
  }
  if (data.phqaAddon.q2 !== 0 && data.phqaAddon.q2 !== 1) {
    throw new Error("ค่า PHQA Addon q2 ไม่ถูกต้อง");
  }

  if (shouldEnter8Q("PHQA", sumPhqa(data.phqa))) {
    validate8Q();
  }
}
