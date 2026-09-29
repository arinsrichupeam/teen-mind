import type { MainAssessmentScale } from "./assessment-scale";

/** Weighted yes values for 8Q items q1–q8 (index 0 = q1). */
export const Q8_YES_WEIGHTS = [1, 2, 6, 8, 9, 5, 10, 4] as const;

export type MainNineAnswers = {
  q1?: number | null;
  q2?: number | null;
  q3?: number | null;
  q4?: number | null;
  q5?: number | null;
  q6?: number | null;
  q7?: number | null;
  q8?: number | null;
  q9?: number | null;
};

export type EightQAnswers = MainNineAnswers & {
  q8Addon?: number | null;
};

export function sumMainAnswers(answers: MainNineAnswers): number {
  return (
    Number(answers.q1 ?? 0) +
    Number(answers.q2 ?? 0) +
    Number(answers.q3 ?? 0) +
    Number(answers.q4 ?? 0) +
    Number(answers.q5 ?? 0) +
    Number(answers.q6 ?? 0) +
    Number(answers.q7 ?? 0) +
    Number(answers.q8 ?? 0) +
    Number(answers.q9 ?? 0)
  );
}

export function sumPhqa(answers: MainNineAnswers): number {
  return sumMainAnswers(answers);
}

export function sum9Q(answers: MainNineAnswers): number {
  return sumMainAnswers(answers);
}

export function sum8Q(answers: EightQAnswers): number {
  return (
    Number(answers.q1 ?? 0) +
    Number(answers.q2 ?? 0) +
    Number(answers.q3 ?? 0) +
    Number(answers.q4 ?? 0) +
    Number(answers.q5 ?? 0) +
    Number(answers.q6 ?? 0) +
    Number(answers.q7 ?? 0) +
    Number(answers.q8 ?? 0) +
    Number(answers.q8Addon ?? 0)
  );
}

/** When q3 is not yes (6), addon must be treated as 0. */
export function normalize8QAddon(
  q3: number,
  addon: number | null | undefined
): number {
  if (Number(q3) === 6) return Number(addon ?? 0);

  return 0;
}

export function sumMainForScale(
  scale: MainAssessmentScale,
  answers: MainNineAnswers
): number {
  return scale === "9Q" ? sum9Q(answers) : sumPhqa(answers);
}
