import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveDrawerCaseId } from "./question-drawer-case-id";

describe("resolveDrawerCaseId", () => {
  it("prefers prop id when local state still holds the previously opened case", () => {
    // Repro: open case A, close, open case B — questionData still A until effect runs
    const propId = "case-B";
    const staleLocalId = "case-A";

    assert.equal(resolveDrawerCaseId(propId, staleLocalId), "case-B");
  });

  it("falls back to local id when prop is missing", () => {
    assert.equal(resolveDrawerCaseId(undefined, "case-A"), "case-A");
  });

  it("returns undefined when both missing", () => {
    assert.equal(resolveDrawerCaseId(null, undefined), undefined);
  });
});
