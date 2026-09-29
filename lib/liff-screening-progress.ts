import type { AssessmentFlowGroup } from "@/lib/assessment-scale";

export type ScreeningSegmentId = "2q" | "main" | "addon" | "8q" | "problem";

export type ScreeningProgressView = {
  sectionNumber: number;
  itemIndex: number;
  itemTotal: number;
  /** 0–100 fill within the current section only */
  progressPercent: number;
  label: string;
};

function sectionNumberFor(
  segment: ScreeningSegmentId,
  ageGroup: AssessmentFlowGroup,
  entered8Q: boolean
): number {
  if (segment === "2q") return 1;
  if (segment === "main") return 2;
  if (segment === "addon") return 3;
  if (segment === "8q") {
    return ageGroup === "phqa" ? 4 : 3;
  }
  // problem
  if (ageGroup === "phqa") {
    return entered8Q ? 5 : 4;
  }

  return entered8Q ? 4 : 3;
}

function q8StepInfo(
  ageGroup: AssessmentFlowGroup,
  questionKey: number,
  q3Yes: boolean
): { itemIndex: number; itemTotal: number } {
  const q8Start = ageGroup === "phqa" ? 14 : 12;
  const addonKey = q8Start + 3;
  const includeAddon = q3Yes;
  const itemTotal = includeAddon ? 9 : 8;

  if (questionKey === addonKey) {
    return { itemIndex: 4, itemTotal };
  }

  // keys: start+0..+2 = q1..q3 → items 1..3
  // if addon: start+4..+8 = q4..q8 → items 5..9
  // if no addon: start+4..+8 = q4..q8 → items 4..8
  if (questionKey < addonKey) {
    return { itemIndex: questionKey - q8Start + 1, itemTotal };
  }

  const afterAddonOffset = questionKey - (q8Start + 4); // 0..4 for q4..q8
  const itemIndex = includeAddon ? 5 + afterAddonOffset : 4 + afterAddonOffset;

  return { itemIndex, itemTotal };
}

/**
 * Citizen LIFF screening progress for DEPRESSION package (presentation only).
 * Section numbers follow the path actually taken; bar fills within the current section.
 */
export function getScreeningProgressView(input: {
  ageGroup: AssessmentFlowGroup;
  questionKey: number;
  show8QInterstitial: boolean;
  /** 2Q led straight to problem (both negative). */
  twoQNegativePath: boolean;
  /** Main scale met 8Q gate (or already in/after 8Q). */
  entered8Q: boolean;
  /** q3 scored "yes" (weight 6) so addon step exists. */
  q8AddonInPath: boolean;
}): ScreeningProgressView {
  const {
    ageGroup,
    questionKey,
    show8QInterstitial,
    twoQNegativePath,
    entered8Q,
    q8AddonInPath,
  } = input;

  const finish = (
    segment: ScreeningSegmentId,
    itemIndex: number,
    itemTotal: number
  ): ScreeningProgressView => {
    const sectionNumber = twoQNegativePath
      ? segment === "2q"
        ? 1
        : 2
      : sectionNumberFor(segment, ageGroup, entered8Q);
    const progressPercent = Math.round((itemIndex * 100) / itemTotal);

    return {
      sectionNumber,
      itemIndex,
      itemTotal,
      progressPercent,
      label: `ส่วนที่ ${sectionNumber} · ข้อ ${itemIndex} จาก ${itemTotal}`,
    };
  };

  if (show8QInterstitial) {
    const sectionNumber = sectionNumberFor("8q", ageGroup, true);
    const itemTotal = 8;

    return {
      sectionNumber,
      itemIndex: 0,
      itemTotal,
      progressPercent: 0,
      label: `ส่วนที่ ${sectionNumber} · พร้อมเริ่ม`,
    };
  }

  if (questionKey <= 2) {
    return finish("2q", questionKey, 2);
  }

  const q8Start = ageGroup === "phqa" ? 14 : 12;
  const q8Last = q8Start + 8;
  const problemKey = q8Last + 1;

  if (twoQNegativePath || questionKey === problemKey) {
    return finish("problem", 1, 1);
  }

  if (ageGroup === "phqa") {
    if (questionKey >= 3 && questionKey <= 11) {
      return finish("main", questionKey - 2, 9);
    }
    if (questionKey >= 12 && questionKey <= 13) {
      return finish("addon", questionKey - 11, 2);
    }
  } else if (questionKey >= 3 && questionKey <= 11) {
    return finish("main", questionKey - 2, 9);
  }

  if (questionKey >= q8Start && questionKey <= q8Last) {
    const { itemIndex, itemTotal } = q8StepInfo(
      ageGroup,
      questionKey,
      q8AddonInPath
    );

    return finish("8q", itemIndex, itemTotal);
  }

  return finish("problem", 1, 1);
}

/** Orange / Red on main, or 8Q moderate+ (sum ≥ 9). */
export function isElevatedScreeningRisk(input: {
  mainResult: string | null;
  eightQSum: number | null;
  took8Q: boolean;
}): boolean {
  if (input.mainResult === "Orange" || input.mainResult === "Red") {
    return true;
  }
  if (input.took8Q && input.eightQSum != null && input.eightQSum >= 9) {
    return true;
  }

  return false;
}
