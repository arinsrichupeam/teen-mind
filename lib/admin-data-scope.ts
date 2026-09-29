import { AdminDataScope, type Prisma } from "@prisma/client";

import { isAdminRole, ROLE_CODE } from "@/lib/admin-roles";

/** Anchors used to resolve Case / member visibility (ADR 0007). */
export type AdminScopeAnchor = {
  scopeLevel: AdminDataScope;
  zoneId: number | null;
  affiliationId: number | null;
  healthcareFacilityId: string | null;
  /** When SUPERADMIN, visibility is unrestricted regardless of scopeLevel. */
  roleCode?: string | null;
};

export type ScopeAnchorValidation = { ok: true } | { ok: false; error: string };

/**
 * Self-registration and default staff rows are FACILITY-scoped.
 * Elevated scopes are assigned by SUPERADMIN after approval.
 */
export function defaultRegisterScopeLevel(): AdminDataScope {
  return AdminDataScope.FACILITY;
}

export function hasUnrestrictedDataScope(admin: AdminScopeAnchor): boolean {
  return (
    admin.roleCode === ROLE_CODE.SUPERADMIN ||
    admin.scopeLevel === AdminDataScope.SYSTEM
  );
}

export function validateScopeAnchors(
  admin: AdminScopeAnchor
): ScopeAnchorValidation {
  switch (admin.scopeLevel) {
    case AdminDataScope.SYSTEM:
      if (admin.zoneId != null || admin.affiliationId != null) {
        return {
          ok: false,
          error: "SYSTEM scope ต้องไม่มี zoneId / affiliationId",
        };
      }

      return { ok: true };

    case AdminDataScope.ZONE:
      if (admin.zoneId == null) {
        return { ok: false, error: "ZONE scope ต้องมี zoneId" };
      }
      if (admin.affiliationId != null) {
        return {
          ok: false,
          error: "ZONE scope ต้องไม่มี affiliationId",
        };
      }

      return { ok: true };

    case AdminDataScope.AFFILIATION:
      if (admin.affiliationId == null) {
        return { ok: false, error: "AFFILIATION scope ต้องมี affiliationId" };
      }
      if (admin.zoneId != null) {
        return {
          ok: false,
          error: "AFFILIATION scope ต้องไม่มี zoneId",
        };
      }

      return { ok: true };

    case AdminDataScope.FACILITY:
      if (!admin.healthcareFacilityId?.trim()) {
        return {
          ok: false,
          error: "FACILITY scope ต้องมี healthcareFacilityId",
        };
      }
      if (admin.affiliationId == null) {
        return {
          ok: false,
          error: "FACILITY scope ต้องมี affiliationId",
        };
      }

      return { ok: true };

    default:
      return { ok: false, error: "scopeLevel ไม่ถูกต้อง" };
  }
}

/** Facility relation filter for HealthcareFacility / nested Case.facility. */
export function buildFacilityRelationFilter(
  admin: AdminScopeAnchor
): Prisma.HealthcareFacilityWhereInput | null {
  if (hasUnrestrictedDataScope(admin)) return null;

  const anchors = validateScopeAnchors(admin);

  if (!anchors.ok) {
    // Invalid anchors → match nothing
    return { id: "__invalid_admin_scope__" };
  }

  switch (admin.scopeLevel) {
    case AdminDataScope.ZONE:
      return { zoneId: admin.zoneId! };
    case AdminDataScope.AFFILIATION:
      return { affiliationId: admin.affiliationId! };
    case AdminDataScope.FACILITY:
      return { id: admin.healthcareFacilityId! };
    default:
      return { id: "__invalid_admin_scope__" };
  }
}

/**
 * Case list / visibility: owning facility in scope, or transfer target in scope.
 * `undefined` = unrestricted (no facility predicate).
 */
export function buildCaseVisibilityWhere(
  admin: AdminScopeAnchor
): Prisma.CaseWhereInput | undefined {
  const facilityFilter = buildFacilityRelationFilter(admin);

  if (facilityFilter == null) return undefined;

  if (admin.scopeLevel === AdminDataScope.FACILITY) {
    const id = admin.healthcareFacilityId!;

    return {
      OR: [{ healthcareFacilityId: id }, { transferToFacilityId: id }],
    };
  }

  return {
    OR: [
      { healthcareFacility: facilityFilter },
      { transferToFacility: facilityFilter },
    ],
  };
}

/**
 * Members directory in radius: staff whose home facility is in scope,
 * or elevated rows anchored to the same zone/affiliation.
 */
export function buildMemberVisibilityWhere(
  admin: AdminScopeAnchor
): Prisma.ProfileAdminWhereInput | undefined {
  if (hasUnrestrictedDataScope(admin)) return undefined;

  const anchors = validateScopeAnchors(admin);

  if (!anchors.ok) {
    return { id: "__invalid_admin_scope__" };
  }

  switch (admin.scopeLevel) {
    case AdminDataScope.ZONE:
      return {
        OR: [
          { zoneId: admin.zoneId! },
          { healthcareFacility: { zoneId: admin.zoneId! } },
        ],
      };
    case AdminDataScope.AFFILIATION:
      return {
        OR: [
          { affiliationId: admin.affiliationId! },
          { healthcareFacility: { affiliationId: admin.affiliationId! } },
        ],
      };
    case AdminDataScope.FACILITY:
      return { healthcareFacilityId: admin.healthcareFacilityId! };
    default:
      return { id: "__invalid_admin_scope__" };
  }
}

export function facilityMatchesAdminScope(
  facility: {
    id: string;
    affiliationId: number;
    zoneId: number | null;
  },
  admin: AdminScopeAnchor
): boolean {
  if (hasUnrestrictedDataScope(admin)) return true;

  const anchors = validateScopeAnchors(admin);

  if (!anchors.ok) return false;

  switch (admin.scopeLevel) {
    case AdminDataScope.ZONE:
      return facility.zoneId === admin.zoneId;
    case AdminDataScope.AFFILIATION:
      return facility.affiliationId === admin.affiliationId;
    case AdminDataScope.FACILITY:
      return facility.id === admin.healthcareFacilityId;
    default:
      return false;
  }
}

export function caseMatchesAdminScope(
  caseRow: {
    healthcareFacilityId: string | null;
    transferToFacilityId: string | null;
    healthcareFacility?: {
      id: string;
      affiliationId: number;
      zoneId: number | null;
    } | null;
    transferToFacility?: {
      id: string;
      affiliationId: number;
      zoneId: number | null;
    } | null;
  },
  admin: AdminScopeAnchor
): boolean {
  if (hasUnrestrictedDataScope(admin)) return true;

  if (
    caseRow.healthcareFacility &&
    facilityMatchesAdminScope(caseRow.healthcareFacility, admin)
  ) {
    return true;
  }

  if (
    caseRow.transferToFacility &&
    facilityMatchesAdminScope(caseRow.transferToFacility, admin)
  ) {
    return true;
  }

  // FACILITY scope can match on ids alone when relations were not loaded
  if (admin.scopeLevel === AdminDataScope.FACILITY) {
    const id = admin.healthcareFacilityId;

    return (
      caseRow.healthcareFacilityId === id || caseRow.transferToFacilityId === id
    );
  }

  return false;
}

export function scopeAnchorFromAdminProfile(admin: {
  scopeLevel: AdminDataScope;
  zoneId: number | null;
  affiliationId: number | null;
  healthcareFacilityId: string | null;
  role?: { code: string } | null;
  roleCode?: string | null;
}): AdminScopeAnchor {
  return {
    scopeLevel: admin.scopeLevel,
    zoneId: admin.zoneId,
    affiliationId: admin.affiliationId,
    healthcareFacilityId: admin.healthcareFacilityId,
    roleCode: admin.roleCode ?? admin.role?.code ?? null,
  };
}

/** Thai labels for AdminDataScope (members UI). */
export const ADMIN_DATA_SCOPE_OPTIONS = [
  { value: AdminDataScope.FACILITY, label: "หน่วยงาน" },
  { value: AdminDataScope.AFFILIATION, label: "สังกัด" },
  { value: AdminDataScope.ZONE, label: "Zone" },
  { value: AdminDataScope.SYSTEM, label: "ทั้งระบบ" },
] as const;

export function adminDataScopeLabel(
  scope: AdminDataScope | string | null | undefined
): string {
  const found = ADMIN_DATA_SCOPE_OPTIONS.find((o) => o.value === scope);

  return found?.label ?? String(scope ?? "หน่วยงาน");
}

/**
 * Effective visibility for API filters (ADR 0007).
 * If stored scope is FACILITY and the home facility is a Zone facilitator
 * ("แม่ zone"), elevate to ZONE for that zone — Admin oversight only.
 * Consult / Volunteer stay FACILITY (operate only their home unit).
 * Explicit ZONE / AFFILIATION / SYSTEM rows are left unchanged.
 */
export function resolveDataScopeAnchor(
  admin: {
    scopeLevel: AdminDataScope;
    zoneId: number | null;
    affiliationId: number | null;
    healthcareFacilityId: string | null;
    roleId?: number | null;
    role?: { code: string } | null;
    roleCode?: string | null;
  },
  facilitatedZoneId: number | null = null
): AdminScopeAnchor {
  const base = scopeAnchorFromAdminProfile(admin);

  if (hasUnrestrictedDataScope(base)) return base;
  if (base.scopeLevel !== AdminDataScope.FACILITY) return base;
  if (facilitatedZoneId == null) return base;

  const roleCode = admin.roleCode ?? admin.role?.code ?? null;

  if (!isAdminRole(admin.roleId, roleCode)) return base;

  return {
    ...base,
    scopeLevel: AdminDataScope.ZONE,
    zoneId: facilitatedZoneId,
    affiliationId: null,
  };
}
