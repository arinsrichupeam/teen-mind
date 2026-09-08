import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { toLegacyQuestionRow } from "./case-to-legacy-question";

describe("toLegacyQuestionRow", () => {
  it("aliases questionnaire relations and exposes legacy risk labels", () => {
    const mapped = toLegacyQuestionRow({
      id: "case-1",
      result: "NEGATIVE",
      status: "PENDING",
      closeCaseReason: null,
      volunteerId: null,
      treatmentNotes: [],
      profile: {
        hn: "680006136",
        firstName: "A",
        lastName: "B",
        birthDate: new Date("2000-01-01"),
        addresses: [{ houseNo: "1" }],
        emergencyContacts: [{ name: "Mom", phone: "081", relation: "แม่" }],
      },
      questions2Q: [{ q1: 0, q2: 0 }],
      questionsPhqa: [{ q1: 0, q2: 0, q3: 0, q4: 0, q5: 0, q6: 0, q7: 0, q8: 0, q9: 0, sum: 0 }],
      questions9Q: [{ q1: 0, q2: 0, q3: 0, q4: 0, q5: 0, q6: 0, q7: 0, q8: 0, q9: 0, sum: 0 }],
      questions8Q: [{ q1: 0, q2: 0, q3: 0, q4: 0, q5: 0, q6: 0, q7: 0, q8: 0, q8Addon: 0, sum: 0 }],
      questionsPhqaAddon: [{ q1: 0, q2: 0 }],
      questionsProblem: [{ sum: 0 }],
    });

    assert.equal(mapped.q2.length, 1);
    assert.equal(mapped.phqa.length, 1);
    assert.equal(mapped.q9.length, 1);
    assert.equal(mapped.q8.length, 1);
    assert.equal(mapped.addon.length, 1);
    assert.equal(mapped.q9[0].sum, 0);
    assert.equal(mapped.result, "Green");
    assert.ok(mapped.result_text.length > 0);
    assert.equal(mapped.status, 1);
    assert.equal(mapped.profile.address?.[0]?.houseNo, "1");
    assert.equal(mapped.profile.emergency?.[0]?.name, "Mom");
  });

  it("shows dash-prone fields populated so admin table can render scores", () => {
    const mapped = toLegacyQuestionRow({
      id: "case-2",
      result: "POSITIVE_MODERATE",
      status: "PENDING",
      treatmentNotes: [],
      profile: { hn: "1", birthDate: new Date("2015-01-01") },
      questions2Q: [{ q1: 1, q2: 0 }],
      questionsPhqa: [
        {
          q1: 2,
          q2: 2,
          q3: 2,
          q4: 2,
          q5: 2,
          q6: 0,
          q7: 0,
          q8: 0,
          q9: 0,
          sum: 10,
        },
      ],
      questions9Q: [],
      questions8Q: [{ sum: 6, q1: 0, q2: 0, q3: 6, q4: 0, q5: 0, q6: 0, q7: 0, q8: 0, q8Addon: 0 }],
      questionsPhqaAddon: [{ q1: 0, q2: 0 }],
    });

    assert.equal(mapped.phqa[0].sum, 10);
    assert.equal(mapped.result, "Yellow");
    assert.match(mapped.result_text, /ปานกลาง|ความเสี่ยง/);
    assert.equal(mapped.q2[0].q1, 1);
    assert.equal(mapped.q8[0].sum, 6);
    assert.equal(mapped.q9.length, 0);
  });
});
