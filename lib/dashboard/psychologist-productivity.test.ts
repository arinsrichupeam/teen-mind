import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  computePsychologistProductivity,
  getRedCaseAccessDelayHours,
  isRedCaseReachedWithin24h,
  type QuestionLike,
} from "./psychologist-productivity";

const baseQuestion = (
  overrides: Partial<QuestionLike> & Pick<QuestionLike, "id" | "createdAt">
): QuestionLike => ({
  profileId: "p1",
  result: "Red",
  consult: "admin-1",
  schedule_telemed: null,
  ...overrides,
});

describe("isRedCaseReachedWithin24h", () => {
  it("returns true when first visit is within 24h of screening", () => {
    const screenedAt = new Date("2026-07-01T10:00:00.000Z");
    const visitedAt = new Date("2026-07-01T20:00:00.000Z");

    assert.equal(
      isRedCaseReachedWithin24h(
        baseQuestion({
          id: "q1",
          createdAt: screenedAt,
          schedule_telemed: visitedAt,
        })
      ),
      true
    );
  });

  it("returns false when first visit is after 24h", () => {
    const screenedAt = new Date("2026-07-01T10:00:00.000Z");
    const visitedAt = new Date("2026-07-02T11:00:00.000Z");

    assert.equal(
      isRedCaseReachedWithin24h(
        baseQuestion({
          id: "q2",
          createdAt: screenedAt,
          schedule_telemed: visitedAt,
        })
      ),
      false
    );
  });

  it("returns false for non-red results", () => {
    assert.equal(
      isRedCaseReachedWithin24h(
        baseQuestion({
          id: "q3",
          result: "Yellow",
          createdAt: new Date("2026-07-01T10:00:00.000Z"),
          schedule_telemed: new Date("2026-07-01T12:00:00.000Z"),
        })
      ),
      false
    );
  });

  it("returns false when round 1 is unreachable", () => {
    assert.equal(
      isRedCaseReachedWithin24h(
        baseQuestion({
          id: "q4",
          createdAt: new Date("2026-07-01T10:00:00.000Z"),
          schedule_telemed: new Date("2026-07-01T12:00:00.000Z"),
          unreachable: true,
        })
      ),
      false
    );
  });

  it("excludes legacy date-only schedule from 24h access metric", () => {
    const screenedAt = new Date("2025-06-11T03:54:04.678Z");
    const legacySchedule = new Date("2025-06-11T00:00:00.000Z");

    assert.equal(
      isRedCaseReachedWithin24h(
        baseQuestion({
          id: "q-legacy-same-day",
          createdAt: screenedAt,
          schedule_telemed: legacySchedule,
        })
      ),
      false
    );
    assert.equal(
      getRedCaseAccessDelayHours(
        baseQuestion({
          id: "q-legacy-same-day",
          createdAt: screenedAt,
          schedule_telemed: legacySchedule,
        })
      ),
      null
    );
  });
});

describe("computePsychologistProductivity redCase24hAccess", () => {
  it("computes percent of red cases reached within 24h by screening date", () => {
    const questions: QuestionLike[] = [
      baseQuestion({
        id: "red-ok",
        createdAt: new Date("2026-07-01T08:00:00.000Z"),
        schedule_telemed: new Date("2026-07-01T12:00:00.000Z"),
      }),
      baseQuestion({
        id: "red-late",
        createdAt: new Date("2026-07-02T08:00:00.000Z"),
        schedule_telemed: new Date("2026-07-04T08:00:00.000Z"),
      }),
      baseQuestion({
        id: "red-none",
        createdAt: new Date("2026-07-03T08:00:00.000Z"),
        consult: null,
        schedule_telemed: null,
      }),
      baseQuestion({
        id: "yellow",
        result: "Yellow",
        createdAt: new Date("2026-07-01T08:00:00.000Z"),
        schedule_telemed: new Date("2026-07-01T09:00:00.000Z"),
      }),
    ];

    const stats = computePsychologistProductivity(
      questions,
      new Map([
        ["admin-1", { prefixId: 1, firstname: "Test", lastname: "User" }],
      ]),
      new Map([["1", "นาย"]]),
      "ทดสอบ",
      {
        startUtc: new Date("2026-07-01T00:00:00.000Z"),
        endUtc: new Date("2026-07-05T00:00:00.000Z"),
      }
    );

    assert.equal(stats.summary.redCase24hAccess.total, 3);
    assert.equal(stats.summary.redCase24hAccess.within24h, 1);
    assert.equal(stats.summary.redCase24hAccess.rate, 33.3);
    // (4h + 48h) / 2 = 26h — ไม่นับเคสที่ยังไม่พบ
    assert.equal(stats.summary.redCase24hAccess.reached, 2);
    assert.equal(stats.summary.redCase24hAccess.avgAccessHours, 26);
  });

  it("excludes legacy date-only schedules from total red case count", () => {
    const questions: QuestionLike[] = [
      baseQuestion({
        id: "red-with-time",
        createdAt: new Date("2026-07-01T08:00:00.000Z"),
        schedule_telemed: new Date("2026-07-01T12:00:00.000Z"),
      }),
      baseQuestion({
        id: "red-legacy-only",
        createdAt: new Date("2026-07-02T08:00:00.000Z"),
        schedule_telemed: new Date("2026-07-02T00:00:00.000Z"),
      }),
    ];

    const stats = computePsychologistProductivity(
      questions,
      new Map([
        ["admin-1", { prefixId: 1, firstname: "Test", lastname: "User" }],
      ]),
      new Map([["1", "นาย"]]),
      "ทดสอบ",
      {
        startUtc: new Date("2026-07-01T00:00:00.000Z"),
        endUtc: new Date("2026-07-05T00:00:00.000Z"),
      }
    );

    assert.equal(stats.summary.redCase24hAccess.total, 1);
    assert.equal(stats.summary.redCase24hAccess.within24h, 1);
    assert.equal(stats.summary.redCase24hAccess.rate, 100);
  });
});
