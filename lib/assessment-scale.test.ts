import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  MAIN_ASSESSMENT_AGE_CUTOFF,
  calculateMainAssessmentResult,
  detectAssessmentMismatch,
  getAssessmentFlowGroupFromAge,
  getMainAssessmentScaleFromAge,
} from "./assessment-scale";

describe("assessment-scale", () => {
  it("uses PHQA for ages below cutoff and 9Q at or above", () => {
    assert.equal(getMainAssessmentScaleFromAge(17), "PHQA");
    assert.equal(getMainAssessmentScaleFromAge(18), "9Q");
    assert.equal(getAssessmentFlowGroupFromAge(17), "phqa");
    assert.equal(getAssessmentFlowGroupFromAge(18), "nineq");
    assert.equal(MAIN_ASSESSMENT_AGE_CUTOFF, 18);
  });

  it("calculates PHQA and 9Q results with different cutoffs for same sum", () => {
    const phqa = calculateMainAssessmentResult(10, "PHQA");
    const nineQ = calculateMainAssessmentResult(10, "9Q");

    assert.equal(phqa.result, "Yellow");
    assert.equal(nineQ.result, "Yellow");
    assert.notEqual(phqa.result_text, nineQ.result_text);
  });

  it("detects mismatch when scale structure does not match age", () => {
    assert.equal(
      detectAssessmentMismatch(15, true, true),
      "wrong_scale_for_age"
    );
    assert.equal(
      detectAssessmentMismatch(20, false, false),
      "wrong_scale_for_age"
    );
    assert.equal(detectAssessmentMismatch(15, false, false), "missing_addon");
    assert.equal(detectAssessmentMismatch(15, false, true), "ok");
    assert.equal(detectAssessmentMismatch(20, true, false), "ok");
    assert.equal(detectAssessmentMismatch(null, false, true), "missing_age");
  });
});
