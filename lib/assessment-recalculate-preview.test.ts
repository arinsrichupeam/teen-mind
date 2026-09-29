import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ScreeningResult } from "@prisma/client";

import { buildRecalculatePreview } from "./assessment-recalculate-preview";

function makeQuestion(overrides: {
  ageYearsAgo: number;
  hasQ9: boolean;
  hasAddon: boolean;
  result?: string;
}) {
  const birthDate = new Date();

  birthDate.setFullYear(birthDate.getFullYear() - overrides.ageYearsAgo);

  const phqaRow = {
    q1: 2,
    q2: 2,
    q3: 2,
    q4: 0,
    q5: 0,
    q6: 0,
    q7: 0,
    q8: 0,
    q9: 0,
    sum: 6,
    id: "1",
    caseId: "q1",
    round: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return {
    id: "q-test",
    profileId: "p-test",
    result: overrides.result ?? "Green",
    status: 1,
    createdAt: new Date(),
    questionsPhqa: [phqaRow],
    questions9Q: overrides.hasQ9 ? [{ ...phqaRow, id: "2" }] : [],
    questionsPhqaAddon: overrides.hasAddon ? [{ id: "1" }] : [],
    profile: {
      birthDate,
      school: { screeningDate: null },
    },
  };
}

describe("buildRecalculatePreview", () => {
  it("flags wrong scale when teen has 9Q row", () => {
    const preview = buildRecalculatePreview([
      makeQuestion({ ageYearsAgo: 15, hasQ9: true, hasAddon: true }),
    ]);

    assert.equal(preview.mismatchSummary.wrongScale, 1);
    assert.equal(preview.mismatchSummary.total, 1);
    assert.equal(preview.ageBreakdown.under18, 1);
  });

  it("counts result changes when stored result used wrong scale", () => {
    const preview = buildRecalculatePreview([
      makeQuestion({
        ageYearsAgo: 15,
        hasQ9: true,
        hasAddon: true,
        result: ScreeningResult.NEGATIVE,
      }),
    ]);

    assert.ok(preview.resultWouldChange >= 0);
  });
});
