import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getScreeningProgressView,
  isElevatedScreeningRisk,
} from "@/lib/liff-screening-progress";

describe("getScreeningProgressView", () => {
  it("numbers 2Q as section 1", () => {
    const view = getScreeningProgressView({
      ageGroup: "phqa",
      questionKey: 2,
      show8QInterstitial: false,
      twoQNegativePath: false,
      entered8Q: false,
      q8AddonInPath: false,
    });

    assert.equal(view.sectionNumber, 1);
    assert.equal(view.label, "ส่วนที่ 1 · ข้อ 2 จาก 2");
    assert.equal(view.progressPercent, 100);
  });

  it("uses path-actual section numbers when 2Q is negative", () => {
    const view = getScreeningProgressView({
      ageGroup: "phqa",
      questionKey: 23,
      show8QInterstitial: false,
      twoQNegativePath: true,
      entered8Q: false,
      q8AddonInPath: false,
    });

    assert.equal(view.sectionNumber, 2);
    assert.equal(view.label, "ส่วนที่ 2 · ข้อ 1 จาก 1");
  });

  it("places PHQ-A addon as section 3", () => {
    const view = getScreeningProgressView({
      ageGroup: "phqa",
      questionKey: 12,
      show8QInterstitial: false,
      twoQNegativePath: false,
      entered8Q: false,
      q8AddonInPath: false,
    });

    assert.equal(view.sectionNumber, 3);
    assert.equal(view.label, "ส่วนที่ 3 · ข้อ 1 จาก 2");
  });

  it("shows 8Q interstitial as section ready state", () => {
    const view = getScreeningProgressView({
      ageGroup: "phqa",
      questionKey: 13,
      show8QInterstitial: true,
      twoQNegativePath: false,
      entered8Q: true,
      q8AddonInPath: false,
    });

    assert.equal(view.sectionNumber, 4);
    assert.equal(view.label, "ส่วนที่ 4 · พร้อมเริ่ม");
    assert.equal(view.progressPercent, 0);
  });

  it("counts 8Q steps without addon as 8", () => {
    const view = getScreeningProgressView({
      ageGroup: "phqa",
      questionKey: 18, // q4 after skipping addon
      show8QInterstitial: false,
      twoQNegativePath: false,
      entered8Q: true,
      q8AddonInPath: false,
    });

    assert.equal(view.sectionNumber, 4);
    assert.equal(view.itemIndex, 4);
    assert.equal(view.itemTotal, 8);
  });
});

describe("isElevatedScreeningRisk", () => {
  it("flags Orange/Red main results", () => {
    assert.equal(
      isElevatedScreeningRisk({
        mainResult: "Orange",
        eightQSum: null,
        took8Q: false,
      }),
      true
    );
    assert.equal(
      isElevatedScreeningRisk({
        mainResult: "Yellow",
        eightQSum: null,
        took8Q: false,
      }),
      false
    );
  });

  it("flags elevated 8Q sums", () => {
    assert.equal(
      isElevatedScreeningRisk({
        mainResult: "Yellow",
        eightQSum: 9,
        took8Q: true,
      }),
      true
    );
  });
});
