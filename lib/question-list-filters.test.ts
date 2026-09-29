import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildCaseWhereFromSearchParams } from "./question-list-filters";

describe("buildCaseWhereFromSearchParams", () => {
  it("returns undefined when no filters", () => {
    const url = new URL("http://localhost/api/question");

    assert.equal(buildCaseWhereFromSearchParams(url), undefined);
  });

  it("builds search and mainScale conditions", () => {
    const url = new URL(
      "http://localhost/api/question?search=สมชาย&mainScale=nineq"
    );
    const where = buildCaseWhereFromSearchParams(url) as {
      AND: Record<string, unknown>[];
    };

    assert.ok(Array.isArray(where.AND));
    assert.ok(
      where.AND.some(
        (c) =>
          JSON.stringify(c).includes("สมชาย") ||
          JSON.stringify(c).includes("firstName")
      )
    );
    assert.ok(where.AND.some((c) => JSON.stringify(c).includes("questions9Q")));
  });
});
