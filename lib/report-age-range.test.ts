import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getProfileAgeForReport,
  matchesReportAgeRange,
  normalizeReportAgeRange,
} from "./report-age-range";

describe("report-age-range", () => {
  it("normalizes age range values", () => {
    assert.equal(normalizeReportAgeRange("under18"), "under18");
    assert.equal(normalizeReportAgeRange("18plus"), "18plus");
    assert.equal(normalizeReportAgeRange("all"), "all");
    assert.equal(normalizeReportAgeRange(null), "all");
  });

  it("uses screeningDate when available", () => {
    const age = getProfileAgeForReport(
      new Date("2010-05-01"),
      new Date("2024-08-01"),
      new Date("2026-01-01")
    );

    assert.equal(age, 14);
  });

  it("falls back to latest assessment date when screeningDate is missing", () => {
    const age = getProfileAgeForReport(
      new Date("2008-03-15"),
      null,
      new Date("2024-06-01")
    );

    assert.equal(age, 16);
  });

  it("matches under18 and 18plus using the same cutoff as overview", () => {
    assert.equal(matchesReportAgeRange(17, "under18"), true);
    assert.equal(matchesReportAgeRange(18, "under18"), false);
    assert.equal(matchesReportAgeRange(18, "18plus"), true);
    assert.equal(matchesReportAgeRange(17, "18plus"), false);
    assert.equal(matchesReportAgeRange(null, "under18"), false);
    assert.equal(matchesReportAgeRange(null, "all"), true);
  });
});
