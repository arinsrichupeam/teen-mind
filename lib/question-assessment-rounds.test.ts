import type { QuestionsData } from "@/types";

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  filterQuestionByAssessmentRound,
  listAssessmentRoundsFromQuestion,
} from "./question-assessment-rounds";

function baseQuestion(overrides: Partial<QuestionsData> = {}): QuestionsData {
  return {
    id: "case-1",
    result: "Yellow",
    result_text: "ความเสี่ยงปานกลาง",
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
    hn: "",
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

describe("question-assessment-rounds", () => {
  it("lists distinct rounds from instrument rows", () => {
    const data = baseQuestion({
      q2: [
        { round: 1, q1: 0, q2: 0 },
        { round: 2, q1: 1, q2: 0 },
      ] as QuestionsData["q2"],
      q9: [{ round: 2, sum: 8 } as QuestionsData["q9"][number]],
    });

    assert.deepEqual(listAssessmentRoundsFromQuestion(data), [1, 2]);
  });

  it("defaults to round 1 when rows have no round field", () => {
    const data = baseQuestion({
      q2: [{ q1: 1, q2: 0 }],
    });

    assert.deepEqual(listAssessmentRoundsFromQuestion(data), [1]);
  });

  it("filters instruments to the selected round", () => {
    const data = baseQuestion({
      q2: [
        { round: 1, q1: 0, q2: 0 },
        { round: 2, q1: 1, q2: 1 },
      ] as QuestionsData["q2"],
      q9: [
        { round: 1, sum: 3 },
        { round: 2, sum: 8 },
      ] as QuestionsData["q9"],
    });

    const round1 = filterQuestionByAssessmentRound(data, 1);
    const round2 = filterQuestionByAssessmentRound(data, 2);

    assert.equal(round1.q2.length, 1);
    assert.equal((round1.q2[0] as { round?: number }).round, 1);
    assert.equal((round1.q9[0] as { sum: number }).sum, 3);

    assert.equal(round2.q2.length, 1);
    assert.equal((round2.q2[0] as { round?: number }).round, 2);
    assert.equal((round2.q9[0] as { sum: number }).sum, 8);
  });
});
