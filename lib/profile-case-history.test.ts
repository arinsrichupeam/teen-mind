import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  countAssessmentRoundsFromInstruments,
  resultLabelFromScreeningResult,
  toProfileCaseHistorySummary,
} from "./profile-case-history";
import { countConsultRoundsFromNotes } from "./case-round-counts";

describe("countConsultRoundsFromNotes", () => {
  it("counts unique rounds that have content", () => {
    assert.equal(
      countConsultRoundsFromNotes([
        { round: 1, consult: "A" },
        { round: 1, subjective: "dup same round" },
        { round: 2, plan: "B" },
        { round: 3 },
      ]),
      2
    );
  });
});

describe("countAssessmentRoundsFromInstruments", () => {
  it("counts distinct instrument rounds", () => {
    assert.equal(
      countAssessmentRoundsFromInstruments({
        questions2Q: [{ round: 1 }, { round: 2 }],
        questions9Q: [{ round: 2 }],
      }),
      2
    );
  });

  it("returns 1 when rows exist without round (legacy)", () => {
    assert.equal(
      countAssessmentRoundsFromInstruments({
        questions2Q: [{}],
      }),
      1
    );
  });

  it("returns 0 when empty", () => {
    assert.equal(countAssessmentRoundsFromInstruments({}), 0);
  });
});

describe("toProfileCaseHistorySummary", () => {
  it("maps case row for service-history list", () => {
    const summary = toProfileCaseHistorySummary({
      id: "case-old",
      createdAt: new Date("2026-09-08T11:04:00.000Z"),
      status: "CLOSED",
      result: "POSITIVE_MODERATE",
      closeCaseReason: "ติดตามครบ",
      healthcareFacility: { name: "ศบส. ทดสอบ" },
      treatmentNotes: [
        { round: 1, consult: "x" },
        {
          round: 2,
          subjective: "s",
          objective: "o",
          assessment: "a",
          plan: "p",
        },
        { round: 3 },
        { round: 4, consult: "y" },
      ],
      questions2Q: [{ round: 1 }, { round: 2 }],
      questions9Q: [{ round: 1 }, { round: 2 }],
    });

    assert.equal(summary.id, "case-old");
    assert.equal(summary.status, "CLOSED");
    assert.equal(summary.resultLabel, "ความเสี่ยงปานกลาง");
    assert.equal(summary.consultRoundCount, 3);
    assert.equal(summary.assessmentRoundCount, 2);
    assert.equal(summary.facilityName, "ศบส. ทดสอบ");
    assert.equal(summary.closeCaseReason, "ติดตามครบ");
    assert.ok(summary.createdAt.includes("2026-09-08"));
  });

  it("labels screening results via legacy colors", () => {
    assert.equal(resultLabelFromScreeningResult("NEGATIVE"), "ไม่พบความเสี่ยง");
    assert.equal(
      resultLabelFromScreeningResult("POSITIVE_SEVERE"),
      "ความเสี่ยงรุนแรง"
    );
  });
});
