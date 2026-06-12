import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { computeAgeSegmentStats, type AgeSegmentRow } from "./age-segment";

function makeRow(
  ageYearsAgo: number,
  mainSum: number,
  result = "Green"
): AgeSegmentRow {
  const birthday = new Date();

  birthday.setFullYear(birthday.getFullYear() - ageYearsAgo);

  return {
    birthday,
    screeningDate: null,
    questionCreatedAt: new Date(),
    result,
    mainSum,
  };
}

describe("computeAgeSegmentStats", () => {
  it("buckets under 18 with PHQA scale and 18+ with 9Q scale", () => {
    const stats = computeAgeSegmentStats(
      [makeRow(16, 10), makeRow(20, 10)],
      "test"
    );

    assert.equal(stats.ageUnder18, 1);
    assert.equal(stats.age18AndOver, 1);
    assert.equal(stats.riskAgeUnder18.yellow, 1);
    assert.equal(stats.riskAge18AndOver.yellow, 1);
  });
});
