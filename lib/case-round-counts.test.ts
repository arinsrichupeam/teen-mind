import type { QuestionsData } from "@/types";

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { countAssessmentRounds, countConsultRounds } from "./case-round-counts";

function baseRow(overrides: Partial<QuestionsData> = {}): QuestionsData {
  return {
    id: "c1",
    result: "Green",
    result_text: "",
    latitude: 0,
    longitude: 0,
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
    schedule_telemed: null,
    follow_up: null,
    consult: "",
    createdAt: "",
    status: 1,
    hn: "1",
    referentId: null,
    profile: {} as QuestionsData["profile"],
    referent: null,
    phqa: [],
    q2: [],
    addon: [],
    q9: [],
    q8: [],
    problem: [],
    ...overrides,
  };
}

describe("case-round-counts", () => {
  it("counts distinct assessment rounds from instruments", () => {
    const row = baseRow({
      q2: [
        { round: 1, q1: 0, q2: 0 },
        { round: 2, q1: 1, q2: 0 },
      ] as QuestionsData["q2"],
    });

    assert.equal(countAssessmentRounds(row), 2);
  });

  it("counts consult rounds from treatmentNotes with content", () => {
    const row = baseRow({
      treatmentNotes: [
        { round: 1, consult: "a", scheduleTelemed: new Date() },
        { round: 2, unreachable: true, scheduleTelemed: new Date() },
        { round: 3 },
      ],
    });

    assert.equal(countConsultRounds(row), 2);
  });
});
