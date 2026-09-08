import { CaseStatus } from "@prisma/client";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  buildLegacyFollowUpStatusWhere,
  mapLegacyFollowUpStatusToCaseStatus,
  mapLegacyFollowUpStatusesToCaseStatuses,
  OPEN_CASE_STATUSES,
} from "./case-status-mapping";

describe("case-status-mapping", () => {
  it("maps follow-up ints to CaseStatus for writes", () => {
    assert.equal(mapLegacyFollowUpStatusToCaseStatus(0), CaseStatus.PENDING);
    assert.equal(mapLegacyFollowUpStatusToCaseStatus(1), CaseStatus.PENDING);
    assert.equal(
      mapLegacyFollowUpStatusToCaseStatus(2),
      CaseStatus.IN_PROGRESS
    );
    assert.equal(mapLegacyFollowUpStatusToCaseStatus(3), CaseStatus.CLOSED);
  });

  it("expands UI filter chips to CaseStatus sets", () => {
    assert.deepEqual(mapLegacyFollowUpStatusesToCaseStatuses([3]), [
      CaseStatus.CLOSED,
    ]);
    assert.ok(
      mapLegacyFollowUpStatusesToCaseStatuses([2]).includes(
        CaseStatus.TRANSFER_PENDING
      )
    );
  });

  it("builds status where that does not use raw ints", () => {
    const where = buildLegacyFollowUpStatusWhere([1, 3]);

    assert.ok(where);
    assert.ok(JSON.stringify(where).includes("PENDING"));
    assert.ok(JSON.stringify(where).includes("CLOSED"));
    assert.ok(!JSON.stringify(where).match(/"status":\s*\{"in":\s*\[\d/));
  });

  it("lists open case statuses without CLOSED", () => {
    assert.ok(!OPEN_CASE_STATUSES.includes(CaseStatus.CLOSED));
    assert.equal(OPEN_CASE_STATUSES.length, 3);
  });
});
