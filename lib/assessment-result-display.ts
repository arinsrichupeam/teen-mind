import type { MainAssessmentScale } from "@/lib/assessment-scale";

import { getEightQRiskLabel } from "@/lib/liff-assessment-history";

/** Which instrument blocks to show on the LIFF result modal after save. */
export type AssessmentResultScenario =
  | "twoq_only"
  | "main_only"
  | "main_and_8q";

export type AssessmentResultDisplayInput = {
  twoQPositive: boolean;
  /** True only when 8Q was entered and persisted (gate passed). */
  took8Q: boolean;
  mainScale: MainAssessmentScale | null;
  mainSum: number | null;
  mainResult: string | null;
  mainResultText: string | null;
  eightQSum: number | null;
};

export type ResultInstrumentBlock = {
  key: "2Q" | "9Q" | "PHQA" | "8Q";
  title: string;
  scoreLine: string | null;
  text: string;
  textColor: string;
  barColor: string;
  scoreRange: string | null;
};

type RiskVisual = {
  textColor: string;
  barColor: string;
  scoreRange: string;
};

const PHQA_RISK_VISUAL: Record<string, RiskVisual> = {
  Green: {
    textColor: "text-green-700",
    barColor: "bg-green-200",
    scoreRange: "0 - 4 คะแนน",
  },
  "Green-Low": {
    textColor: "text-green-600",
    barColor: "bg-green-400",
    scoreRange: "5 - 9 คะแนน",
  },
  Yellow: {
    textColor: "text-yellow-700",
    barColor: "bg-yellow-500",
    scoreRange: "10 - 14 คะแนน",
  },
  Orange: {
    textColor: "text-orange-700",
    barColor: "bg-orange-500",
    scoreRange: "15 - 19 คะแนน",
  },
  Red: {
    textColor: "text-red-700",
    barColor: "bg-red-500",
    scoreRange: "20 - 27 คะแนน",
  },
};

export function resolveAssessmentResultScenario(
  twoQPositive: boolean,
  took8Q: boolean
): AssessmentResultScenario {
  if (!twoQPositive) return "twoq_only";
  if (took8Q) return "main_and_8q";

  return "main_only";
}

export function getTwoQNegativeDisplay(): ResultInstrumentBlock {
  return {
    key: "2Q",
    title: "2Q",
    scoreLine: null,
    text: "ไม่เข้าเกณฑ์ประเมินต่อ (ปกติ)",
    textColor: "text-green-700",
    barColor: "bg-green-300",
    scoreRange: "ทั้ง 2 ข้อตอบปกติ",
  };
}

export function getNineQRiskDisplay(
  sum: number
): Omit<ResultInstrumentBlock, "key" | "title" | "scoreLine"> {
  if (sum < 7) {
    return {
      text: "ไม่มีอาการของโรคซึมเศร้า",
      textColor: "text-green-700",
      barColor: "bg-green-300",
      scoreRange: "< 7 คะแนน",
    };
  }

  if (sum <= 12) {
    return {
      text: "มีอาการของโรคซึมเศร้า ระดับน้อย",
      textColor: "text-yellow-700",
      barColor: "bg-yellow-400",
      scoreRange: "7 - 12 คะแนน",
    };
  }

  if (sum <= 18) {
    return {
      text: "มีอาการของโรคซึมเศร้า ระดับปานกลาง",
      textColor: "text-orange-700",
      barColor: "bg-orange-500",
      scoreRange: "13 - 18 คะแนน",
    };
  }

  return {
    text: "มีอาการของโรคซึมเศร้า ระดับรุนแรง",
    textColor: "text-red-700",
    barColor: "bg-red-500",
    scoreRange: ">= 19 คะแนน",
  };
}

export function getEightQRiskDisplay(
  sum: number
): Omit<ResultInstrumentBlock, "key" | "title" | "scoreLine"> {
  if (sum === 0) {
    return {
      text: getEightQRiskLabel(0),
      textColor: "text-green-700",
      barColor: "bg-green-300",
      scoreRange: "0 คะแนน",
    };
  }

  if (sum <= 8) {
    return {
      text: getEightQRiskLabel(sum),
      textColor: "text-yellow-700",
      barColor: "bg-yellow-400",
      scoreRange: "1 - 8 คะแนน",
    };
  }

  if (sum <= 16) {
    return {
      text: getEightQRiskLabel(sum),
      textColor: "text-orange-700",
      barColor: "bg-orange-500",
      scoreRange: "9 - 16 คะแนน",
    };
  }

  return {
    text: getEightQRiskLabel(sum),
    textColor: "text-red-700",
    barColor: "bg-red-500",
    scoreRange: ">= 17 คะแนน",
  };
}

function getMainBlock(
  scale: MainAssessmentScale,
  sum: number,
  result: string | null,
  resultText: string | null
): ResultInstrumentBlock {
  if (scale === "9Q") {
    const visual = getNineQRiskDisplay(sum);

    return {
      key: "9Q",
      title: "9Q",
      scoreLine: `คะแนนรวม 9Q: ${sum} คะแนน`,
      ...visual,
    };
  }

  const visual = PHQA_RISK_VISUAL[result ?? ""] ?? PHQA_RISK_VISUAL.Red;

  return {
    key: "PHQA",
    title: "PHQ-A",
    scoreLine: `คะแนนรวม PHQ-A: ${sum} คะแนน`,
    text: resultText || visual.scoreRange,
    textColor: visual.textColor,
    barColor: visual.barColor,
    scoreRange: visual.scoreRange,
  };
}

/**
 * Build ordered result blocks for the post-submit modal.
 * Scenarios: 2Q only · main (9Q/PHQ-A) · main + 8Q.
 */
export function buildAssessmentResultBlocks(
  input: AssessmentResultDisplayInput
): ResultInstrumentBlock[] {
  const scenario = resolveAssessmentResultScenario(
    input.twoQPositive,
    input.took8Q
  );

  if (scenario === "twoq_only") {
    return [getTwoQNegativeDisplay()];
  }

  const blocks: ResultInstrumentBlock[] = [];

  if (input.mainScale != null && input.mainSum != null) {
    blocks.push(
      getMainBlock(
        input.mainScale,
        input.mainSum,
        input.mainResult,
        input.mainResultText
      )
    );
  }

  if (scenario === "main_and_8q" && input.eightQSum != null) {
    const eightQ = getEightQRiskDisplay(input.eightQSum);

    blocks.push({
      key: "8Q",
      title: "8Q",
      scoreLine: `คะแนนรวม 8Q: ${input.eightQSum} คะแนน`,
      ...eightQ,
    });
  }

  return blocks;
}
