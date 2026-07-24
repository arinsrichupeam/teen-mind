import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getScreeningStartByRound,
  resolveSchoolScreeningDate,
} from "@/lib/school-screening";

describe("resolveSchoolScreeningDate", () => {
  const screenings = [
    {
      round: 1,
      startDate: new Date("2025-06-01T00:00:00.000Z"),
      endDate: new Date("2025-06-03T00:00:00.000Z"),
    },
    {
      round: 2,
      startDate: new Date("2026-06-05T00:00:00.000Z"),
      endDate: new Date("2026-06-07T00:00:00.000Z"),
    },
  ];

  it("uses containing period startDate", () => {
    const result = resolveSchoolScreeningDate(
      screenings,
      new Date("2025-06-02T10:00:00.000Z")
    );

    assert.equal(result?.toISOString(), "2025-06-01T00:00:00.000Z");
  });

  it("uses nearest period when outside ranges", () => {
    const result = resolveSchoolScreeningDate(
      screenings,
      new Date("2026-07-01T00:00:00.000Z")
    );

    assert.equal(result?.toISOString(), "2026-06-05T00:00:00.000Z");
  });

  it("falls back to legacy screeningDate", () => {
    const legacy = new Date("2024-05-01T00:00:00.000Z");
    const result = resolveSchoolScreeningDate([], null, legacy);

    assert.equal(result?.toISOString(), legacy.toISOString());
  });
});

describe("getScreeningStartByRound", () => {
  it("returns startDate for the requested round", () => {
    const result = getScreeningStartByRound(
      [
        {
          round: 2,
          startDate: new Date("2026-06-05T00:00:00.000Z"),
          endDate: null,
        },
      ],
      2
    );

    assert.equal(result?.toISOString(), "2026-06-05T00:00:00.000Z");
  });

  it("falls back to legacy for round 1", () => {
    const legacy = new Date("2025-01-01T00:00:00.000Z");
    const result = getScreeningStartByRound([], 1, legacy);

    assert.equal(result?.toISOString(), legacy.toISOString());
  });
});
