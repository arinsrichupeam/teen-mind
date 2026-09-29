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
      questionsPhqa: [
        {
          q1: 0,
          q2: 0,
          q3: 0,
          q4: 0,
          q5: 0,
          q6: 0,
          q7: 0,
          q8: 0,
          q9: 0,
          sum: 0,
        },
      ],
      questions9Q: [
        {
          q1: 0,
          q2: 0,
          q3: 0,
          q4: 0,
          q5: 0,
          q6: 0,
          q7: 0,
          q8: 0,
          q9: 0,
          sum: 0,
        },
      ],
      questions8Q: [
        {
          q1: 0,
          q2: 0,
          q3: 0,
          q4: 0,
          q5: 0,
          q6: 0,
          q7: 0,
          q8: 0,
          q8Addon: 0,
          sum: 0,
        },
      ],
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
    assert.equal(mapped.caseStatus, "PENDING");
    assert.equal(mapped.assigneeName, null);
    assert.equal(mapped.profile.address?.[0]?.houseNo, "1");
    assert.equal(mapped.profile.emergency?.[0]?.name, "Mom");
  });

  it("maps assigneeAdmin to assigneeName", () => {
    const mapped = toLegacyQuestionRow({
      id: "case-assigned",
      result: "NEGATIVE",
      status: "IN_PROGRESS",
      assigneeAdminId: "admin-1",
      assigneeAdmin: {
        id: "admin-1",
        userId: "user-1",
        firstName: "สมชาย",
        lastName: "ใจดี",
      },
      treatmentNotes: [],
      profile: { hn: "1", birthDate: new Date("2000-01-01") },
      questions2Q: [],
      questionsPhqa: [],
      questions9Q: [],
      questions8Q: [],
      questionsPhqaAddon: [],
      questionsProblem: [],
    });

    assert.equal(mapped.caseStatus, "IN_PROGRESS");
    assert.equal(mapped.assigneeAdminId, "admin-1");
    assert.equal(mapped.assigneeUserId, "user-1");
    assert.equal(mapped.assigneeName, "สมชาย ใจดี");
  });

  it("prefers the latest AssessmentRound when multiple instrument rows exist", () => {
    const mapped = toLegacyQuestionRow({
      id: "case-multi",
      result: "POSITIVE_MODERATE",
      status: "IN_PROGRESS",
      treatmentNotes: [],
      profile: { hn: "1", birthDate: new Date("2000-01-01") },
      questions2Q: [
        { round: 1, q1: 0, q2: 0 },
        { round: 2, q1: 1, q2: 1 },
      ],
      questions9Q: [
        {
          round: 1,
          q1: 0,
          q2: 0,
          q3: 0,
          q4: 0,
          q5: 0,
          q6: 0,
          q7: 0,
          q8: 0,
          q9: 0,
          sum: 0,
        },
        {
          round: 2,
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
      questionsPhqa: [],
      questions8Q: [],
      questionsPhqaAddon: [],
      questionsProblem: [],
    });

    assert.equal(mapped.q2[0].round, 2);
    assert.equal(mapped.q9[0].sum, 10);
    assert.equal(mapped.result, "Yellow");
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
      questions8Q: [
        {
          sum: 6,
          q1: 0,
          q2: 0,
          q3: 6,
          q4: 0,
          q5: 0,
          q6: 0,
          q7: 0,
          q8: 0,
          q8Addon: 0,
        },
      ],
      questionsPhqaAddon: [{ q1: 0, q2: 0 }],
    });

    assert.equal(mapped.phqa[0].sum, 10);
    assert.equal(mapped.result, "Yellow");
    assert.match(mapped.result_text, /ปานกลาง|ความเสี่ยง/);
    assert.equal(mapped.q2[0].q1, 1);
    assert.equal(mapped.q8[0].sum, 6);
    assert.equal(mapped.q9.length, 0);
  });

  it("keeps status 3 when Case is CLOSED even if follow-up rounds are incomplete", () => {
    const mapped = toLegacyQuestionRow({
      id: "case-closed",
      result: "NEGATIVE",
      status: "CLOSED",
      closeCaseReason: "ติดต่อไม่ได้",
      treatmentNotes: [],
      profile: { hn: "680006136", birthDate: new Date("2000-01-01") },
      questions2Q: [{ q1: 0, q2: 0 }],
      questionsPhqa: [],
      questions9Q: [{ sum: 0 }],
      questions8Q: [{ sum: 0 }],
      questionsPhqaAddon: [],
    });

    assert.equal(mapped.status, 3);
    assert.equal(mapped.close_case_reason, "ติดต่อไม่ได้");
  });

  it("exposes treatmentNotes array for uncapped consult UI", () => {
    const mapped = toLegacyQuestionRow({
      id: "case-notes",
      result: "NEGATIVE",
      status: "IN_PROGRESS",
      treatmentNotes: [
        {
          round: 1,
          consult: "a",
          scheduleTelemed: new Date("2026-01-01"),
          unreachable: false,
        },
        {
          round: 4,
          consult: "b",
          scheduleTelemed: new Date("2026-02-01"),
          unreachable: false,
        },
      ],
      profile: { hn: "1", birthDate: new Date("2000-01-01") },
      questions2Q: [],
      questionsPhqa: [],
      questions9Q: [],
      questions8Q: [],
      questionsPhqaAddon: [],
      questionsProblem: [],
    });

    assert.equal(mapped.treatmentNotes?.length, 2);
    assert.equal(mapped.treatmentNotes?.[1]?.round, 4);
    assert.equal(mapped.status, 2);
  });
});
