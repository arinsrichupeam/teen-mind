import { getServerSession } from "next-auth";
import { AdminStatus } from "@prisma/client";

import {
  resolveDataScopeAnchor,
  type AdminScopeAnchor,
} from "@/lib/admin-data-scope";
import {
  ADMIN_ROLE_ID,
  canManageMembers,
  canOperateFacilityCases,
  resolveRoleCapabilities,
  type RoleCapabilities,
} from "@/lib/admin-roles";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/utils/prisma";

/**
 * ดึง session ปัจจุบันสำหรับใช้ใน API Route หรือ Server Component
 * คืนค่า null ถ้าไม่ได้ล็อกอิน
 */
export async function getSession() {
  return getServerSession(authOptions);
}

const adminProfileInclude = {
  role: { select: { id: true, code: true, name: true } },
  healthcareFacility: { select: { id: true, name: true } },
} as const;

export type AdminAuth = NonNullable<Awaited<ReturnType<typeof requireAdmin>>>;

/**
 * ตรวจสอบว่าเป็น admin ที่อนุมัติแล้ว (ProfileAdmin.status = APPROVED)
 * คืนค่า { session, adminProfile, capabilities, dataScope } หรือ null
 */
export async function requireAdmin() {
  const session = await getSession();

  if (!session?.user?.id) return null;

  const adminProfile = await prisma.profileAdmin.findUnique({
    where: { userId: session.user.id },
    include: adminProfileInclude,
  });

  if (!adminProfile || adminProfile.status !== AdminStatus.APPROVED) {
    return null;
  }

  const facilitatedZone = adminProfile.healthcareFacilityId
    ? await prisma.zone.findFirst({
        where: {
          facilitatorFacilityId: adminProfile.healthcareFacilityId,
          status: true,
        },
        select: { id: true },
      })
    : null;

  const dataScope: AdminScopeAnchor = resolveDataScopeAnchor(
    adminProfile,
    facilitatedZone?.id ?? null
  );

  return {
    session,
    adminProfile,
    capabilities: resolveRoleCapabilities(
      adminProfile.roleId,
      adminProfile.role?.code
    ),
    dataScope,
  };
}

/** ProfileAdmin whose roleId is in `roleIds` (e.g. Consult+Admin for case ops). */
export async function requireRole(roleIds: number[]) {
  const auth = await requireAdmin();

  if (!auth) return null;
  if (!roleIds.includes(auth.adminProfile.roleId)) return null;

  return auth;
}

/** Admin menu / org / members — roleId 4 only. */
export async function requireAdminOnly() {
  return requireRole([ADMIN_ROLE_ID]);
}

/** Claim / note / transfer operators — Consult or Admin. */
export async function requireCaseOperator() {
  const auth = await requireAdmin();

  if (!auth || !canOperateFacilityCases(auth.adminProfile.roleId)) {
    return null;
  }

  return auth;
}

/** Members write — Admin only; also exposes canManageMembers for callers. */
export async function requireMembersManager() {
  const auth = await requireAdmin();

  if (!auth || !canManageMembers(auth.adminProfile.roleId)) {
    return null;
  }

  return auth;
}

/**
 * ตรวจสอบว่าเป็นอสท. (มี Volunteer ที่ citizenId ตรงกับ Profile ของ session)
 * คืนค่า { session, referent } หรือ null
 */
export async function requireReferent() {
  const session = await getSession();

  if (!session?.user?.id) return null;

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: { citizenId: true },
  });

  if (!profile?.citizenId) return null;

  const referent = await prisma.volunteer.findFirst({
    where: { citizenId: profile.citizenId, status: true },
    select: { id: true, firstName: true, lastName: true },
  });

  return referent ? { session, referent } : null;
}

export type { RoleCapabilities };
