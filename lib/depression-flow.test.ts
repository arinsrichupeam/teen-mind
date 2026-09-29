import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  isTwoQPositive,
  nextAfterTwoQ,
  shouldEnter8Q,
  isWave1CitizenPackage,
  WAVE1_CITIZEN_PACKAGE,
  resolveDepressionBackStep,
} from "./depression-flow";

describe("depression-flow", () => {
  it("treats 2Q as positive when either item is 1", () => {
    assert.equal(isTwoQPositive(0, 0), false);
    assert.equal(isTwoQPositive(1, 0), true);
    assert.equal(isTwoQPositive(0, 1), true);
    assert.equal(isTwoQPositive(1, 1), true);
  });

  it("routes negative 2Q to Problem and positive 2Q to main scale", () => {
    assert.equal(nextAfterTwoQ(0, 0), "problem");
    assert.equal(nextAfterTwoQ(1, 0), "main");
  });

  it("gates 8Q at 9Q >= 7 and PHQ-A >= 10", () => {
    assert.equal(shouldEnter8Q("9Q", 6), false);
    assert.equal(shouldEnter8Q("9Q", 7), true);
    assert.equal(shouldEnter8Q("PHQA", 9), false);
    assert.equal(shouldEnter8Q("PHQA", 10), true);
  });

  it("allows only DEPRESSION for wave-1 citizen Cases", () => {
    assert.equal(WAVE1_CITIZEN_PACKAGE, "DEPRESSION");
    assert.equal(isWave1CitizenPackage("DEPRESSION"), true);
    assert.equal(isWave1CitizenPackage("FULL"), false);
    assert.equal(isWave1CitizenPackage("BURNOUT"), false);
  });

  it("backs from problem/PHQA/9Q using section flags even if questionKey is stale", () => {
    const base = {
      show8QInterstitial: false,
      showPHQAAddon: false,
      showQ8: false,
      twoQNegativePath: false,
      entered8Q: false,
      q8q3: 99,
      phqaAddonQ2Answered: true,
      q9q9Answered: true,
    };

    const fromProblemStaleKey = resolveDepressionBackStep({
      ...base,
      ageGroup: "phqa",
      questionKey: 1,
      showProblem: true,
      showPHQA: false,
      showQ9: false,
    });

    assert.equal(fromProblemStaleKey.action, "step");
    if (fromProblemStaleKey.action === "step") {
      assert.equal(fromProblemStaleKey.questionKey, 13);
      assert.equal(fromProblemStaleKey.showPHQAAddon, true);
      assert.equal(fromProblemStaleKey.showProblem, false);
    }

    const fromPhqaStaleKey = resolveDepressionBackStep({
      ...base,
      ageGroup: "phqa",
      questionKey: 1,
      showProblem: false,
      showPHQA: true,
      showQ9: false,
    });

    assert.equal(fromPhqaStaleKey.action, "step");
    if (fromPhqaStaleKey.action === "step") {
      assert.equal(fromPhqaStaleKey.questionKey, 2);
      assert.equal(fromPhqaStaleKey.showPHQA, false);
    }

    const fromNineq = resolveDepressionBackStep({
      ...base,
      ageGroup: "nineq",
      questionKey: 5,
      showProblem: false,
      showPHQA: false,
      showQ9: true,
    });

    assert.equal(fromNineq.action, "step");
    if (fromNineq.action === "step") {
      assert.equal(fromNineq.questionKey, 4);
      assert.equal(fromNineq.showQ9, true);
    }

    const fromTwoQFirst = resolveDepressionBackStep({
      ...base,
      ageGroup: "phqa",
      questionKey: 1,
      showProblem: false,
      showPHQA: false,
      showQ9: false,
    });

    assert.deepEqual(fromTwoQFirst, { action: "exit" });
  });
});
