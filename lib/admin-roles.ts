/** Legacy numeric Role ids used by ProfileAdmin / sidebar (keep stable for existing rows). */
export const VOLUNTEER_ROLE_ID = 2;
export const CONSULT_ROLE_ID = 3;
export const ADMIN_ROLE_ID = 4;

/** Role.code values aligned with schema comments (STAFF ≈ Consult). */
export const ROLE_CODE = {
  VOLUNTEER: "VOLUNTEER",
  STAFF: "STAFF",
  ADMIN: "ADMIN",
  SUPERADMIN: "SUPERADMIN",
} as const;

export type RoleCapabilities = {
  canClaimCase: boolean;
  canOperateFacilityCases: boolean;
  canManageOrg: boolean;
  canManageMembers: boolean;
  canViewCrossFacilityCases: boolean;
};

export function isConsultRole(
  roleId: number | string | null | undefined,
  roleCode?: string | null
): boolean {
  if (roleCode === ROLE_CODE.STAFF) return true;

  return Number(roleId) === CONSULT_ROLE_ID;
}

export function isAdminRole(
  roleId: number | string | null | undefined,
  roleCode?: string | null
): boolean {
  if (roleCode === ROLE_CODE.ADMIN || roleCode === ROLE_CODE.SUPERADMIN) {
    return true;
  }

  return Number(roleId) === ADMIN_ROLE_ID;
}

/** Volunteer / Consult / Admin may be assigned on ProfileAdmin (not citizen User=1). */
export function isStaffAssignableRole(roleId: number): boolean {
  return (
    roleId === VOLUNTEER_ROLE_ID ||
    roleId === CONSULT_ROLE_ID ||
    roleId === ADMIN_ROLE_ID
  );
}

/** Only Consult may claim (become assignee of) a PENDING case. */
export function canClaimCase(
  roleId: number | string | null | undefined,
  roleCode?: string | null
): boolean {
  return isConsultRole(roleId, roleCode);
}

/** Consult or Admin may operate facility cases (notes / transfer / close / list). */
export function canOperateFacilityCases(
  roleId: number | string | null | undefined,
  roleCode?: string | null
): boolean {
  return isConsultRole(roleId, roleCode) || isAdminRole(roleId, roleCode);
}

export function canManageOrg(
  roleId: number | string | null | undefined,
  roleCode?: string | null
): boolean {
  return isAdminRole(roleId, roleCode);
}

export function canManageMembers(
  roleId: number | string | null | undefined,
  roleCode?: string | null
): boolean {
  return isAdminRole(roleId, roleCode);
}

/**
 * Case queues are facility-scoped for Admin and Consult alike.
 * Only SUPERADMIN (code) may list/operate across facilities — reserved; not in default seed.
 */
export function canViewCrossFacilityCases(
  _roleId: number | string | null | undefined,
  roleCode?: string | null
): boolean {
  return roleCode === ROLE_CODE.SUPERADMIN;
}

export function resolveRoleCapabilities(
  roleId: number | string | null | undefined,
  roleCode?: string | null
): RoleCapabilities {
  return {
    canClaimCase: canClaimCase(roleId, roleCode),
    canOperateFacilityCases: canOperateFacilityCases(roleId, roleCode),
    canManageOrg: canManageOrg(roleId, roleCode),
    canManageMembers: canManageMembers(roleId, roleCode),
    canViewCrossFacilityCases: canViewCrossFacilityCases(roleId, roleCode),
  };
}
