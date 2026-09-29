import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  assertCanOpenAssessmentRound,
  nextAssessmentRoundNumber,
  isAssessmentRoundComplete,
} from "./assessment-rounds";

describe("assessment-rounds", () => {
  it("treats non-INCOMPLETE ScreeningResult as a complete assessment round", () => {
    assert.equal(isAssessmentRoundComplete("INCOMPLETE"), false);
    assert.equal(isAssessmentRoundComplete("NEGATIVE"), true);
    assert.equal(isAssessmentRoundComplete("POSITIVE_SEVERE"), true);
  });

  it("computes next round from the highest existing instrument round", () => {
    assert.equal(nextAssessmentRoundNumber([]), 1);
    assert.equal(nextAssessmentRoundNumber([1]), 2);
    assert.equal(nextAssessmentRoundNumber([1, 2, 2]), 3);
  });

  it("allows opening the next round only on an open Case with complete current screening", () => {
    assert.doesNotThrow(() =>
      assertCanOpenAssessmentRound({
        caseStatus: "IN_PROGRESS",
        currentResult: "NEGATIVE",
      })
    );

    assert.throws(
      () =>
        assertCanOpenAssessmentRound({
          caseStatus: "CLOSED",
          currentResult: "NEGATIVE",
        }),
      /ปิดแล้ว/
    );

    assert.throws(
      () =>
        assertCanOpenAssessmentRound({
          caseStatus: "PENDING",
          currentResult: "INCOMPLETE",
        }),
      /ยังไม่ครบ|INCOMPLETE/
    );

    assert.throws(
      () =>
        assertCanOpenAssessmentRound({
          caseStatus: "TRANSFER_PENDING",
          currentResult: "POSITIVE_LOW",
        }),
      /ส่งต่อ|TRANSFER/
    );
  });
});
