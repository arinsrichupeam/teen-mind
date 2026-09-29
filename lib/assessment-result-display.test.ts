import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildAssessmentResultBlocks,
  resolveAssessmentResultScenario,
} from "@/lib/assessment-result-display";

describe("resolveAssessmentResultScenario", () => {
  it("returns twoq_only when 2Q is negative", () => {
    assert.equal(resolveAssessmentResultScenario(false, false), "twoq_only");
    assert.equal(resolveAssessmentResultScenario(false, true), "twoq_only");
  });

  it("returns main_only when 2Q positive but 8Q not taken", () => {
    assert.equal(resolveAssessmentResultScenario(true, false), "main_only");
  });

  it("returns main_and_8q when 2Q positive and 8Q taken", () => {
    assert.equal(resolveAssessmentResultScenario(true, true), "main_and_8q");
  });
});

describe("buildAssessmentResultBlocks", () => {
  it("shows only 2Q for negative screen", () => {
    const blocks = buildAssessmentResultBlocks({
      twoQPositive: false,
      took8Q: false,
      mainScale: null,
      mainSum: null,
      mainResult: "Green",
      mainResultText: "",
      eightQSum: null,
    });

    assert.equal(blocks.length, 1);
    assert.equal(blocks[0]!.key, "2Q");
    assert.match(blocks[0]!.text, /ไม่เข้าเกณฑ์/);
    assert.equal(blocks[0]!.scoreLine, null);
  });

  it("shows 9Q only when below 8Q gate", () => {
    const blocks = buildAssessmentResultBlocks({
      twoQPositive: true,
      took8Q: false,
      mainScale: "9Q",
      mainSum: 0,
      mainResult: "Green",
      mainResultText: "ไม่มีอาการ",
      eightQSum: null,
    });

    assert.equal(blocks.length, 1);
    assert.equal(blocks[0]!.key, "9Q");
    assert.match(blocks[0]!.scoreLine ?? "", /9Q/);
    assert.equal(
      blocks.some((b) => b.key === "8Q"),
      false
    );
  });

  it("shows PHQ-A only when below 8Q gate", () => {
    const blocks = buildAssessmentResultBlocks({
      twoQPositive: true,
      took8Q: false,
      mainScale: "PHQA",
      mainSum: 3,
      mainResult: "Green",
      mainResultText: "ไม่พบความเสี่ยง",
      eightQSum: null,
    });

    assert.equal(blocks.length, 1);
    assert.equal(blocks[0]!.key, "PHQA");
    assert.match(blocks[0]!.scoreLine ?? "", /PHQ-A/);
  });

  it("shows main + 8Q when gate passed", () => {
    const blocks = buildAssessmentResultBlocks({
      twoQPositive: true,
      took8Q: true,
      mainScale: "9Q",
      mainSum: 10,
      mainResult: "Yellow",
      mainResultText: "มีอาการของโรคซึมเศร้า ระดับน้อย",
      eightQSum: 0,
    });

    assert.deepEqual(
      blocks.map((b) => b.key),
      ["9Q", "8Q"]
    );
    assert.match(blocks[1]!.scoreLine ?? "", /8Q/);
  });
});
