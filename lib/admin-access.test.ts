import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { AdminStatus } from "@prisma/client";

import { isApprovedAdminStatus } from "./admin-access";

describe("isApprovedAdminStatus", () => {
  it("allows only APPROVED / legacy 1", () => {
    assert.equal(isApprovedAdminStatus(AdminStatus.APPROVED), true);
    assert.equal(isApprovedAdminStatus("APPROVED"), true);
    assert.equal(isApprovedAdminStatus(1), true);
  });

  it("blocks PENDING, DISABLED, and unknown (no /admin access)", () => {
    assert.equal(isApprovedAdminStatus(AdminStatus.PENDING), false);
    assert.equal(isApprovedAdminStatus(AdminStatus.DISABLED), false);
    assert.equal(isApprovedAdminStatus(0), false);
    assert.equal(isApprovedAdminStatus(3), false);
    assert.equal(isApprovedAdminStatus(null), false);
    assert.equal(isApprovedAdminStatus(undefined), false);
  });
});
