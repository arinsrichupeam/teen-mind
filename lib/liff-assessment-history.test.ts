import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildCaseCentricHistory,
  getEightQRiskLabel,
} from "./liff-assessment-history";

describe("buildCaseCentricHistory", () => {
  it("groups rounds under one Case and details instruments", () => {
    const groups = buildCaseCentricHistory([
      {
        id: "c1",
        createdAt: "2026-09-01T00:00:00.000Z",
        result: "NEGATIVE",
        status: "IN_PROGRESS",
        questions2Q: [
          { round: 1, q1: 0, q2: 0, createdAt: "2026-09-01T00:00:00.000Z" },
          { round: 2, q1: 1, q2: 0, createdAt: "2026-09-02T00:00:00.000Z" },
        ],
        questions9Q: [
          {
            round: 2,
            sum: 10,
            createdAt: "2026-09-02T00:00:00.000Z",
          },
        ],
        questions8Q: [{ round: 2, sum: 3 }],
        questionsProblem: [
          { round: 1, sum: 0 },
          { round: 2, sum: 2 },
        ],
      },
    ]);

    assert.equal(groups.length, 1);
    assert.equal(groups[0]!.rounds.length, 2);
    assert.equal(groups[0]!.rounds[0]!.round, 1);
    assert.match(groups[0]!.rounds[0]!.instruments[0]!.detail, /ไม่เข้าเกณฑ์/);
    assert.equal(
      groups[0]!.rounds[1]!.instruments.some((i) => i.name === "9Q"),
      true
    );
    assert.equal(
      groups[0]!.rounds[1]!.instruments.some((i) => i.name === "8Q"),
      true
    );
  });

  it("orders newest Case first while numbering from oldest", () => {
    const groups = buildCaseCentricHistory([
      {
        id: "old",
        createdAt: "2026-08-01T00:00:00.000Z",
        result: "NEGATIVE",
        status: "CLOSED",
        questions2Q: [{ round: 1, q1: 0, q2: 0 }],
      },
      {
        id: "new",
        createdAt: "2026-09-01T00:00:00.000Z",
        result: "POSITIVE_MODERATE",
        status: "PENDING",
        questions2Q: [{ round: 1, q1: 1, q2: 0 }],
        questions9Q: [{ round: 1, sum: 10 }],
      },
    ]);

    assert.equal(groups[0]!.caseId, "new");
    assert.equal(groups[0]!.caseNumber, 2);
    assert.equal(groups[1]!.caseNumber, 1);
  });
});

describe("getEightQRiskLabel", () => {
  it("maps sum bands", () => {
    assert.match(getEightQRiskLabel(0), /ไม่มีแนวโน้ม/);
    assert.match(getEightQRiskLabel(5), /น้อย/);
    assert.match(getEightQRiskLabel(12), /ปานกลาง/);
    assert.match(getEightQRiskLabel(20), /รุนแรง/);
  });
});
