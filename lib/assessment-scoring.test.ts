import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  normalize8QAddon,
  Q8_YES_WEIGHTS,
  sum8Q,
  sum9Q,
  sumPhqa,
} from "./assessment-scoring";
import {
  getRequiredSteps,
  isTwoQPositive,
  shouldEnter8Q,
} from "./depression-flow";
import { sumProblem, validateAssessmentPayload } from "./assessment-payload";

describe("assessment-scoring", () => {
  it("sums PHQ-A / 9Q item scores", () => {
    const answers = {
      q1: 1,
      q2: 2,
      q3: 3,
      q4: 0,
      q5: 1,
      q6: 0,
      q7: 2,
      q8: 1,
      q9: 0,
    };

    assert.equal(sumPhqa(answers), 10);
    assert.equal(sum9Q(answers), 10);
  });

  it("sums 8Q including addon and normalizes addon when q3 is no", () => {
    assert.equal(
      sum8Q({
        q1: 1,
        q2: 2,
        q3: 6,
        q4: 8,
        q5: 0,
        q6: 0,
        q7: 0,
        q8: 0,
        q8Addon: 8,
      }),
      25
    );
    assert.equal(normalize8QAddon(6, 8), 8);
    assert.equal(normalize8QAddon(0, 8), 0);
    assert.equal(Q8_YES_WEIGHTS.length, 8);
  });
});

describe("depression-flow getRequiredSteps", () => {
  it("skips main and 8Q when 2Q negative", () => {
    assert.deepEqual(
      getRequiredSteps({ ageGroup: "phqa", q2: { q1: 0, q2: 0 } }),
      ["q2", "problem"]
    );
    assert.equal(isTwoQPositive(0, 0), false);
  });

  it("includes 8Q for PHQA when mainSum gates in", () => {
    assert.deepEqual(
      getRequiredSteps({
        ageGroup: "phqa",
        q2: { q1: 1, q2: 0 },
        mainSum: 10,
      }),
      ["q2", "phqa", "addon", "q8", "problem"]
    );
    assert.equal(shouldEnter8Q("PHQA", 9), false);
  });

  it("omits 8Q when mainSum below gate", () => {
    assert.deepEqual(
      getRequiredSteps({
        ageGroup: "nineq",
        q2: { q1: 1, q2: 0 },
        mainSum: 6,
      }),
      ["q2", "q9", "problem"]
    );
  });
});

describe("assessment-payload", () => {
  it("counts selected problems and validates payload shape", () => {
    assert.equal(
      sumProblem({ familyRelation: 1, studyStress: 1, socialBullying: 0 }),
      2
    );

    assert.doesNotThrow(() =>
      validateAssessmentPayload(
        {
          profileId: "p1",
          Q2: { q1: 0, q2: 0 },
        },
        "PHQA",
        false
      )
    );
  });
});
