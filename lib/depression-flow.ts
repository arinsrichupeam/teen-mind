import type {
  AssessmentFlowGroup,
  MainAssessmentScale,
} from "./assessment-scale";

/** Wave-1 citizen Cases may only use this AssessmentPackage (UI + API). */
export const WAVE1_CITIZEN_PACKAGE = "DEPRESSION" as const;

export type Wave1CitizenPackage = typeof WAVE1_CITIZEN_PACKAGE;

export type DepressionStepAfterTwoQ = "main" | "problem";

export type DepressionStepId =
  | "q2"
  | "phqa"
  | "addon"
  | "q9"
  | "q8"
  | "problem";

export function isTwoQPositive(q1: number, q2: number): boolean {
  return q1 === 1 || q2 === 1;
}

/** After 2Q: positive → PHQ-A/9Q path; negative → Problem (skip main + 8Q). */
export function nextAfterTwoQ(q1: number, q2: number): DepressionStepAfterTwoQ {
  return isTwoQPositive(q1, q2) ? "main" : "problem";
}

/** 8Q gates: 9Q ≥ 7, PHQ-A ≥ 10 (ADR 0003). */
export function shouldEnter8Q(
  scale: MainAssessmentScale,
  sum: number
): boolean {
  if (scale === "9Q") return sum >= 7;

  return sum >= 10;
}

/**
 * Required instrument steps for a depression assessment run.
 * When `mainSum` is omitted, 8Q is included whenever 2Q is positive (admin wizard default).
 * Pass `mainSum` to apply the real 8Q gate (LIFF / API).
 */
export function getRequiredSteps(args: {
  ageGroup: AssessmentFlowGroup;
  q2: { q1: number; q2: number };
  mainSum?: number;
}): DepressionStepId[] {
  const steps: DepressionStepId[] = ["q2"];
  const twoQPositive = isTwoQPositive(args.q2.q1, args.q2.q2);

  if (!twoQPositive) {
    steps.push("problem");

    return steps;
  }

  const scale: MainAssessmentScale = args.ageGroup === "nineq" ? "9Q" : "PHQA";

  if (scale === "9Q") {
    steps.push("q9");
  } else {
    steps.push("phqa", "addon");
  }

  const include8Q =
    args.mainSum === undefined ? true : shouldEnter8Q(scale, args.mainSum);

  if (include8Q) {
    steps.push("q8");
  }

  steps.push("problem");

  return steps;
}

export function isWave1CitizenPackage(
  packageName: string
): packageName is Wave1CitizenPackage {
  return packageName === WAVE1_CITIZEN_PACKAGE;
}

export function getDepressionStepKeys(ageGroup: AssessmentFlowGroup) {
  const q8Start = ageGroup === "phqa" ? 14 : 12;
  const q8LastKey = q8Start + 8;
  const problemStepKey = q8LastKey + 1;

  return { q8Start, q8LastKey, problemStepKey };
}

export type DepressionScreenFlags = {
  showPHQA: boolean;
  showPHQAAddon: boolean;
  showQ9: boolean;
  showQ8: boolean;
  showProblem: boolean;
  show8QInterstitial: boolean;
  twoQNegativePath: boolean;
  entered8Q: boolean;
};

export type DepressionBackTarget =
  | { action: "exit" }
  | ({
      action: "step";
      questionKey: number;
      canProceed: boolean;
    } & DepressionScreenFlags);

/**
 * Resolve LIFF depression "ย้อนกลับ" target.
 * Section flags win over a stale `questionKey` so mid-flow back never exits to /liff/question.
 */
export function resolveDepressionBackStep(input: {
  ageGroup: AssessmentFlowGroup;
  questionKey: number;
  show8QInterstitial: boolean;
  showProblem: boolean;
  showPHQA: boolean;
  showPHQAAddon: boolean;
  showQ9: boolean;
  showQ8: boolean;
  twoQNegativePath: boolean;
  entered8Q: boolean;
  q8q3: number;
  phqaAddonQ2Answered: boolean;
  q9q9Answered: boolean;
}): DepressionBackTarget {
  const {
    ageGroup,
    questionKey,
    show8QInterstitial,
    showProblem,
    showPHQA,
    showPHQAAddon,
    showQ9,
    showQ8,
    twoQNegativePath,
    entered8Q,
    q8q3,
    phqaAddonQ2Answered,
    q9q9Answered,
  } = input;
  const { q8Start, q8LastKey, problemStepKey } =
    getDepressionStepKeys(ageGroup);

  const flagsForKey = (
    key: number,
    path: Partial<DepressionScreenFlags> = {}
  ): DepressionScreenFlags => {
    const nextTwoQNegative = path.twoQNegativePath ?? false;
    const nextEntered8Q = path.entered8Q ?? entered8Q;

    if (ageGroup === "phqa") {
      return {
        showPHQA: key >= 3 && key <= 11,
        showPHQAAddon: key >= 12 && key <= 13,
        showQ9: false,
        showQ8: key >= q8Start && key <= q8LastKey,
        showProblem: key === problemStepKey,
        show8QInterstitial: false,
        twoQNegativePath: nextTwoQNegative,
        entered8Q: nextEntered8Q,
      };
    }

    return {
      showPHQA: false,
      showPHQAAddon: false,
      showQ9: key >= 3 && key <= 11,
      showQ8: key >= q8Start && key <= q8LastKey,
      showProblem: key === problemStepKey,
      show8QInterstitial: false,
      twoQNegativePath: nextTwoQNegative,
      entered8Q: nextEntered8Q,
    };
  };

  const step = (
    key: number,
    canProceed: boolean,
    path: Partial<DepressionScreenFlags> = {}
  ): DepressionBackTarget => ({
    action: "step",
    questionKey: key,
    canProceed,
    ...flagsForKey(key, path),
  });

  if (show8QInterstitial) {
    if (ageGroup === "phqa") {
      return step(13, phqaAddonQ2Answered, { entered8Q: false });
    }

    return step(11, q9q9Answered, { entered8Q: false });
  }

  // Visible section wins — even if questionKey is stale (e.g. still 1).
  if (showProblem || questionKey === problemStepKey) {
    if (twoQNegativePath) {
      return step(2, true, { twoQNegativePath: false, entered8Q: false });
    }
    if (entered8Q) {
      return step(q8LastKey, true, { entered8Q: true });
    }
    if (ageGroup === "phqa") {
      return step(13, true, { entered8Q: false });
    }

    return step(11, true, { entered8Q: false });
  }

  if (showQ8 || (questionKey >= q8Start && questionKey <= q8LastKey)) {
    const key =
      questionKey >= q8Start && questionKey <= q8LastKey
        ? questionKey
        : q8Start;

    if (key <= q8Start) {
      return {
        action: "step",
        questionKey: ageGroup === "phqa" ? 13 : 11,
        canProceed: false,
        showPHQA: false,
        showPHQAAddon: ageGroup === "phqa",
        showQ9: ageGroup === "nineq",
        showQ8: false,
        showProblem: false,
        show8QInterstitial: true,
        twoQNegativePath: false,
        entered8Q: true,
      };
    }

    if (key === q8Start + 4 && q8q3 === 0) {
      return step(q8Start + 2, true, { entered8Q: true });
    }

    return step(key - 1, true, { entered8Q: true });
  }

  if (
    showPHQAAddon ||
    (ageGroup === "phqa" && questionKey >= 12 && questionKey <= 13)
  ) {
    const key = questionKey >= 12 && questionKey <= 13 ? questionKey : 12;

    if (key <= 12) {
      return step(11, true);
    }

    return step(12, true);
  }

  if (showPHQA || showQ9 || (questionKey >= 3 && questionKey <= 11)) {
    const key = questionKey >= 3 && questionKey <= 11 ? questionKey : 3;

    if (key <= 3) {
      return step(2, true, { entered8Q: false });
    }

    return step(key - 1, true);
  }

  if (questionKey <= 1) {
    return { action: "exit" };
  }

  return step(questionKey - 1, true, {
    twoQNegativePath: false,
    entered8Q: false,
  });
}
