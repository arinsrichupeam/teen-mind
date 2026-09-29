import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  applyDefaultConsult,
  canOpenNoteRound,
  emptyTreatmentNote,
  isNoteConsultComplete,
  isNoteFollowUpComplete,
  isNoteUnreachableDocumented,
  nextTreatmentNoteRound,
  normalizeTreatmentNotes,
} from "./treatment-note-rounds";

describe("treatment-note-rounds", () => {
  it("normalizes empty list to round 1", () => {
    const notes = normalizeTreatmentNotes([]);

    assert.equal(notes.length, 1);
    assert.equal(notes[0]!.round, 1);
  });

  it("defaults empty consult to assignee without overwriting saved values", () => {
    const notes = normalizeTreatmentNotes([
      { round: 1, consult: null },
      { round: 2, consult: "already-set" },
    ]);
    const withDefault = applyDefaultConsult(notes, "assignee-user");

    assert.equal(withDefault[0]!.consult, "assignee-user");
    assert.equal(withDefault[1]!.consult, "already-set");
    assert.deepEqual(applyDefaultConsult(notes, null), notes);
    assert.deepEqual(applyDefaultConsult(notes, "  "), notes);
  });

  it("computes next round without a 3-cap", () => {
    assert.equal(nextTreatmentNoteRound([emptyTreatmentNote(1)]), 2);
    assert.equal(
      nextTreatmentNoteRound([
        emptyTreatmentNote(1),
        emptyTreatmentNote(2),
        emptyTreatmentNote(3),
      ]),
      4
    );
  });

  it("requires previous round complete before opening the next", () => {
    const incomplete = normalizeTreatmentNotes([
      { round: 1, consult: null, scheduleTelemed: null },
    ]);

    assert.equal(canOpenNoteRound(incomplete, 2), false);
    assert.equal(canOpenNoteRound(incomplete, 2, {}), false);

    const complete = normalizeTreatmentNotes([
      {
        round: 1,
        consult: "a",
        scheduleTelemed: new Date(),
        serviceEndedAt: new Date(),
        subjective: "s",
        objective: "o",
        assessment: "a",
        plan: "p",
        sessionSelfHarmRisk: "NOT_FOUND",
        psychRisk: "NONE",
        presentingTopics: ["FAMILY"],
        interventions: ["SUPPORTIVE_COUNSELING"],
        sessionOutcome: "IMPROVED",
        afterCarePlan: "END_FOLLOWUP",
      },
    ]);

    assert.equal(isNoteConsultComplete(complete[0]), true);
    assert.equal(isNoteFollowUpComplete(complete[0]), true);
    assert.equal(canOpenNoteRound(complete, 2), true);
    assert.equal(canOpenNoteRound(complete, 2, { 1: true }), true);
    assert.equal(canOpenNoteRound(complete, 2, {}), false);

    const missingEnd = normalizeTreatmentNotes([
      {
        round: 1,
        consult: "a",
        scheduleTelemed: new Date(),
        serviceEndedAt: null,
      },
    ]);

    assert.equal(isNoteConsultComplete(missingEnd[0]), false);
  });

  it("requires contact owner when documenting unreachable round", () => {
    const withoutOwner = normalizeTreatmentNotes([
      {
        round: 1,
        unreachable: true,
        scheduleTelemed: new Date(),
        consult: null,
      },
    ]);

    assert.equal(isNoteUnreachableDocumented(withoutOwner[0]), false);

    const withOwner = normalizeTreatmentNotes([
      {
        round: 1,
        unreachable: true,
        scheduleTelemed: new Date(),
        consult: "staff-1",
      },
    ]);

    assert.equal(isNoteUnreachableDocumented(withOwner[0]), true);
  });
});
