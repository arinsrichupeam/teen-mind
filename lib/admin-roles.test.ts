import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ADMIN_ROLE_ID,
  CONSULT_ROLE_ID,
  VOLUNTEER_ROLE_ID,
  canClaimCase,
  canManageMembers,
  canManageOrg,
  canOperateFacilityCases,
  canViewCrossFacilityCases,
  isAdminRole,
  isConsultRole,
  isStaffAssignableRole,
  resolveRoleCapabilities,
} from "./admin-roles";

describe("admin-roles", () => {
  it("recognizes Consult and Admin role ids", () => {
    assert.equal(isConsultRole(CONSULT_ROLE_ID), true);
    assert.equal(isConsultRole(ADMIN_ROLE_ID), false);
    assert.equal(isAdminRole(ADMIN_ROLE_ID), true);
    assert.equal(isAdminRole(CONSULT_ROLE_ID), false);
  });

  it("allows only Consult to claim; Consult and Admin may operate facility cases", () => {
    assert.equal(canClaimCase(CONSULT_ROLE_ID), true);
    assert.equal(canClaimCase(ADMIN_ROLE_ID), false);
    assert.equal(canClaimCase(VOLUNTEER_ROLE_ID), false);
    assert.equal(canOperateFacilityCases(CONSULT_ROLE_ID), true);
    assert.equal(canOperateFacilityCases(ADMIN_ROLE_ID), true);
    assert.equal(canOperateFacilityCases(VOLUNTEER_ROLE_ID), false);
  });

  it("restricts org/members to Admin; cases are facility-scoped (no cross-facility for Admin)", () => {
    assert.equal(canManageOrg(ADMIN_ROLE_ID), true);
    assert.equal(canManageOrg(CONSULT_ROLE_ID), false);
    assert.equal(canManageMembers(ADMIN_ROLE_ID), true);
    assert.equal(canManageMembers(CONSULT_ROLE_ID), false);
    assert.equal(canViewCrossFacilityCases(ADMIN_ROLE_ID), false);
    assert.equal(canViewCrossFacilityCases(CONSULT_ROLE_ID), false);
    assert.equal(canViewCrossFacilityCases(ADMIN_ROLE_ID, "SUPERADMIN"), true);
  });

  it("limits assignable ProfileAdmin roles to Volunteer/Consult/Admin", () => {
    assert.equal(isStaffAssignableRole(1), false);
    assert.equal(isStaffAssignableRole(VOLUNTEER_ROLE_ID), true);
    assert.equal(isStaffAssignableRole(CONSULT_ROLE_ID), true);
    assert.equal(isStaffAssignableRole(ADMIN_ROLE_ID), true);
  });

  it("resolves a capability snapshot from roleId", () => {
    const consult = resolveRoleCapabilities(CONSULT_ROLE_ID);
    const admin = resolveRoleCapabilities(ADMIN_ROLE_ID);

    assert.equal(consult.canClaimCase, true);
    assert.equal(consult.canManageOrg, false);
    assert.equal(admin.canClaimCase, false);
    assert.equal(admin.canOperateFacilityCases, true);
    assert.equal(admin.canManageMembers, true);
    assert.equal(admin.canViewCrossFacilityCases, false);
  });

  it("recognizes Consult via role code STAFF as well as id", () => {
    assert.equal(isConsultRole(999, "STAFF"), true);
    assert.equal(isConsultRole(CONSULT_ROLE_ID, "STAFF"), true);
    assert.equal(canClaimCase(2, "STAFF"), true);
    assert.equal(canClaimCase("3"), true);
  });
});
