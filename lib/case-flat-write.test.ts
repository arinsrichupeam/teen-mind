import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { extractTreatmentNotesFromLegacyFlat } from "./case-flat-write";

describe("extractTreatmentNotesFromLegacyFlat", () => {
  it("maps round-1 consult + schedule into TreatmentNote payload", () => {
    const notes = extractTreatmentNotesFromLegacyFlat({
      consult: "user-abc",
      schedule_telemed: "2026-09-08T10:00:00.000Z",
      unreachable: false,
    });

    assert.equal(notes.length, 1);
    assert.equal(notes[0].round, 1);
    assert.equal(notes[0].consult, "user-abc");
    assert.ok(notes[0].scheduleTelemed instanceof Date);
  });

  it("maps round 2–3 suffixes and skips empty rounds", () => {
    const notes = extractTreatmentNotesFromLegacyFlat({
      consult2: "c2",
      schedule_telemed2: "2026-09-09T01:00:00.000Z",
      subjective3: "s3",
      objective3: "o3",
      assessment3: "a3",
      plan3: "p3",
    });

    assert.equal(notes.length, 2);
    assert.equal(notes[0].round, 2);
    assert.equal(notes[0].consult, "c2");
    assert.equal(notes[1].round, 3);
    assert.equal(notes[1].subjective, "s3");
  });

  it("treats unreachable-only as content for a round", () => {
    const notes = extractTreatmentNotesFromLegacyFlat({
      unreachable: true,
      schedule_telemed: "2026-09-08T10:00:00.000Z",
    });

    assert.equal(notes.length, 1);
    assert.equal(notes[0].unreachable, true);
  });
});
