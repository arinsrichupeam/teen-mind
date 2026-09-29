import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { AdminDataScope } from "@prisma/client";

import {
  buildCaseVisibilityWhere,
  buildMemberVisibilityWhere,
  caseMatchesAdminScope,
  facilityMatchesAdminScope,
  hasUnrestrictedDataScope,
  resolveDataScopeAnchor,
  validateScopeAnchors,
} from "@/lib/admin-data-scope";

const facilityA = {
  id: "fac-a",
  affiliationId: 10,
  zoneId: 1 as number | null,
};
const facilityB = {
  id: "fac-b",
  affiliationId: 10,
  zoneId: null as number | null,
};
const facilityC = {
  id: "fac-c",
  affiliationId: 20,
  zoneId: 1 as number | null,
};

describe("hasUnrestrictedDataScope", () => {
  it("is true for SYSTEM scope", () => {
    assert.equal(
      hasUnrestrictedDataScope({
        scopeLevel: AdminDataScope.SYSTEM,
        zoneId: null,
        affiliationId: null,
        healthcareFacilityId: null,
      }),
      true
    );
  });

  it("is true for SUPERADMIN role even at FACILITY", () => {
    assert.equal(
      hasUnrestrictedDataScope({
        scopeLevel: AdminDataScope.FACILITY,
        zoneId: null,
        affiliationId: 1,
        healthcareFacilityId: "fac-a",
        roleCode: "SUPERADMIN",
      }),
      true
    );
  });
});

describe("validateScopeAnchors", () => {
  it("requires zoneId and null affiliation for ZONE", () => {
    assert.equal(
      validateScopeAnchors({
        scopeLevel: AdminDataScope.ZONE,
        zoneId: 1,
        affiliationId: null,
        healthcareFacilityId: null,
      }).ok,
      true
    );
    assert.equal(
      validateScopeAnchors({
        scopeLevel: AdminDataScope.ZONE,
        zoneId: 1,
        affiliationId: 10,
        healthcareFacilityId: null,
      }).ok,
      false
    );
  });

  it("requires affiliationId and null zone for AFFILIATION", () => {
    assert.equal(
      validateScopeAnchors({
        scopeLevel: AdminDataScope.AFFILIATION,
        zoneId: null,
        affiliationId: 10,
        healthcareFacilityId: "optional-home",
      }).ok,
      true
    );
  });

  it("requires facility and affiliation for FACILITY", () => {
    assert.equal(
      validateScopeAnchors({
        scopeLevel: AdminDataScope.FACILITY,
        zoneId: null,
        affiliationId: 10,
        healthcareFacilityId: "fac-a",
      }).ok,
      true
    );
    assert.equal(
      validateScopeAnchors({
        scopeLevel: AdminDataScope.FACILITY,
        zoneId: null,
        affiliationId: 10,
        healthcareFacilityId: null,
      }).ok,
      false
    );
  });
});

describe("facilityMatchesAdminScope", () => {
  const zoneAdmin = {
    scopeLevel: AdminDataScope.ZONE,
    zoneId: 1,
    affiliationId: null,
    healthcareFacilityId: null,
  };
  const affiliationAdmin = {
    scopeLevel: AdminDataScope.AFFILIATION,
    zoneId: null,
    affiliationId: 10,
    healthcareFacilityId: null,
  };

  it("ZONE sees only facilities in that zone (including other affiliations)", () => {
    assert.equal(facilityMatchesAdminScope(facilityA, zoneAdmin), true);
    assert.equal(facilityMatchesAdminScope(facilityB, zoneAdmin), false);
    assert.equal(facilityMatchesAdminScope(facilityC, zoneAdmin), true);
  });

  it("AFFILIATION sees all facilities in affiliation regardless of zone", () => {
    assert.equal(facilityMatchesAdminScope(facilityA, affiliationAdmin), true);
    assert.equal(facilityMatchesAdminScope(facilityB, affiliationAdmin), true);
    assert.equal(facilityMatchesAdminScope(facilityC, affiliationAdmin), false);
  });
});

describe("caseMatchesAdminScope", () => {
  it("allows transfer target in FACILITY scope", () => {
    const admin = {
      scopeLevel: AdminDataScope.FACILITY,
      zoneId: null,
      affiliationId: 10,
      healthcareFacilityId: "fac-a",
    };

    assert.equal(
      caseMatchesAdminScope(
        {
          healthcareFacilityId: "fac-other",
          transferToFacilityId: "fac-a",
        },
        admin
      ),
      true
    );
  });

  it("allows owning facility in ZONE via relation", () => {
    const admin = {
      scopeLevel: AdminDataScope.ZONE,
      zoneId: 1,
      affiliationId: null,
      healthcareFacilityId: null,
    };

    assert.equal(
      caseMatchesAdminScope(
        {
          healthcareFacilityId: "fac-c",
          transferToFacilityId: null,
          healthcareFacility: facilityC,
        },
        admin
      ),
      true
    );
  });
});

describe("resolveDataScopeAnchor (แม่ zone)", () => {
  it("elevates Admin at FACILITY facilitator to ZONE scope", () => {
    const effective = resolveDataScopeAnchor(
      {
        scopeLevel: AdminDataScope.FACILITY,
        zoneId: null,
        affiliationId: 2,
        healthcareFacilityId: "fac-ratchaphiphat",
        roleCode: "ADMIN",
      },
      3
    );

    assert.equal(effective.scopeLevel, AdminDataScope.ZONE);
    assert.equal(effective.zoneId, 3);
    assert.equal(effective.affiliationId, null);
    assert.equal(effective.healthcareFacilityId, "fac-ratchaphiphat");
  });

  it("does not elevate Consult at แม่ zone — stays FACILITY (no peer cases)", () => {
    const effective = resolveDataScopeAnchor(
      {
        scopeLevel: AdminDataScope.FACILITY,
        zoneId: null,
        affiliationId: 2,
        healthcareFacilityId: "fac-nongchok",
        roleCode: "STAFF",
      },
      3
    );

    assert.equal(effective.scopeLevel, AdminDataScope.FACILITY);
    assert.equal(effective.zoneId, null);
    assert.equal(
      facilityMatchesAdminScope(
        { id: "fac-dusit", affiliationId: 2, zoneId: 3 },
        effective
      ),
      false
    );
    assert.equal(
      caseMatchesAdminScope(
        {
          healthcareFacilityId: "fac-dusit",
          transferToFacilityId: null,
          healthcareFacility: {
            id: "fac-dusit",
            affiliationId: 2,
            zoneId: 3,
          },
        },
        effective
      ),
      false
    );
  });

  it("does not elevate when facility is not a zone facilitator", () => {
    const effective = resolveDataScopeAnchor(
      {
        scopeLevel: AdminDataScope.FACILITY,
        zoneId: null,
        affiliationId: 2,
        healthcareFacilityId: "fac-bangrak",
        roleCode: "ADMIN",
      },
      null
    );

    assert.equal(effective.scopeLevel, AdminDataScope.FACILITY);
    assert.equal(effective.zoneId, null);
  });

  it("ZONE-elevated Admin sees peer facility in same zone", () => {
    const effective = resolveDataScopeAnchor(
      {
        scopeLevel: AdminDataScope.FACILITY,
        zoneId: null,
        affiliationId: 2,
        healthcareFacilityId: "fac-ratchaphiphat",
        roleCode: "ADMIN",
      },
      3
    );

    assert.equal(
      facilityMatchesAdminScope(
        { id: "fac-bangrak", affiliationId: 2, zoneId: 3 },
        effective
      ),
      true
    );
  });
});

describe("buildCaseVisibilityWhere / buildMemberVisibilityWhere", () => {
  it("returns undefined when unrestricted", () => {
    assert.equal(
      buildCaseVisibilityWhere({
        scopeLevel: AdminDataScope.SYSTEM,
        zoneId: null,
        affiliationId: null,
        healthcareFacilityId: null,
      }),
      undefined
    );
    assert.equal(
      buildMemberVisibilityWhere({
        scopeLevel: AdminDataScope.SYSTEM,
        zoneId: null,
        affiliationId: null,
        healthcareFacilityId: null,
        roleCode: "SUPERADMIN",
      }),
      undefined
    );
  });

  it("builds AFFILIATION case OR on facility relations", () => {
    const where = buildCaseVisibilityWhere({
      scopeLevel: AdminDataScope.AFFILIATION,
      zoneId: null,
      affiliationId: 10,
      healthcareFacilityId: null,
    });

    assert.deepEqual(where, {
      OR: [
        { healthcareFacility: { affiliationId: 10 } },
        { transferToFacility: { affiliationId: 10 } },
      ],
    });
  });

  it("builds ZONE member OR on zoneId and home facility zone", () => {
    const where = buildMemberVisibilityWhere({
      scopeLevel: AdminDataScope.ZONE,
      zoneId: 3,
      affiliationId: null,
      healthcareFacilityId: null,
    });

    assert.deepEqual(where, {
      OR: [{ zoneId: 3 }, { healthcareFacility: { zoneId: 3 } }],
    });
  });
});
