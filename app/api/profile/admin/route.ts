import { AdminDataScope, type Prisma } from "@prisma/client";

import { ProfileAdminData } from "@/types";
import { prisma } from "@/utils/prisma";
import { isStaffAssignableRole, ROLE_CODE } from "@/lib/admin-roles";
import {
  buildMemberVisibilityWhere,
  resolveDataScopeAnchor,
  validateScopeAnchors,
} from "@/lib/admin-data-scope";
import { requireAdmin, requireMembersManager } from "@/lib/get-session";
import {
  mapAdminStatusToLegacyNumber,
  mapLegacyAdminStatus,
} from "@/lib/legacy-value-mapping";

export async function GET(req: Request) {
  const auth = await requireAdmin();

  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const roleIdParam = searchParams.get("roleId");
  const facilityId = searchParams.get("healthcareFacilityId");
  const statusParam = searchParams.get("status");

  const where: Prisma.ProfileAdminWhereInput = {};

  if (roleIdParam) {
    const roleId = parseInt(roleIdParam, 10);

    if (!Number.isNaN(roleId)) where.roleId = roleId;
  }
  if (statusParam) {
    const legacyStatus = parseInt(statusParam, 10);

    if (!Number.isNaN(legacyStatus)) {
      where.status = mapLegacyAdminStatus(legacyStatus);
    }
  }

  const scopeWhere = buildMemberVisibilityWhere(auth.dataScope);

  // Consult peers: still home-facility only when they cannot manage members
  if (
    !auth.capabilities.canManageMembers &&
    auth.adminProfile.healthcareFacilityId
  ) {
    where.healthcareFacilityId = auth.adminProfile.healthcareFacilityId;
  } else if (scopeWhere) {
    Object.assign(where, scopeWhere);
  }

  if (facilityId) {
    where.healthcareFacilityId = facilityId;
  }

  const [data, facilitatorZones] = await Promise.all([
    prisma.profileAdmin.findMany({
      where,
      include: {
        user: {
          select: {
            image: true,
          },
        },
        role: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        healthcareFacility: {
          select: {
            id: true,
            name: true,
          },
        },
        zone: {
          select: { id: true, name: true },
        },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    prisma.zone.findMany({
      where: { status: true, facilitatorFacilityId: { not: null } },
      select: {
        id: true,
        name: true,
        facilitatorFacilityId: true,
      },
    }),
  ]);

  const facilitatorByFacility = new Map(
    facilitatorZones
      .filter((z) => z.facilitatorFacilityId)
      .map((z) => [z.facilitatorFacilityId!, z])
  );

  // Members / consultant dropdown still key off legacy status ints (1=ใช้งาน)
  return Response.json(
    data.map((row) => {
      const facilitated = row.healthcareFacilityId
        ? facilitatorByFacility.get(row.healthcareFacilityId)
        : undefined;
      const effective = resolveDataScopeAnchor(row, facilitated?.id ?? null);

      return {
        ...row,
        status: mapAdminStatusToLegacyNumber(row.status),
        agency: row.healthcareFacility?.name ?? null,
        effectiveScopeLevel: effective.scopeLevel,
        facilitatedZoneId: facilitated?.id ?? null,
        facilitatedZoneName: facilitated?.name ?? null,
      };
    })
  );
}

export async function POST(req: Request) {
  const auth = await requireMembersManager();

  if (!auth) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = await req.json();
  const profile_data: ProfileAdminData = data.profile_data;
  const nextRoleId = parseInt(profile_data.roleId.toString(), 10);
  const isSuperAdmin = auth.adminProfile.role?.code === ROLE_CODE.SUPERADMIN;

  if (!isStaffAssignableRole(nextRoleId) && !isSuperAdmin) {
    return Response.json(
      { error: "roleId must be Volunteer, Consult, or Admin" },
      { status: 400 }
    );
  }

  const existing = await prisma.profileAdmin.findUnique({
    where: { id: profile_data.id },
    select: {
      scopeLevel: true,
      zoneId: true,
      affiliationId: true,
      healthcareFacilityId: true,
    },
  });

  if (!existing) {
    return Response.json({ error: "ไม่พบผู้ใช้งาน" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {
    prefixId: parseInt(profile_data.prefixId.toString()),
    firstName: profile_data.firstName,
    lastName: profile_data.lastName,
    phone: profile_data.phone,
    employeeTypeId: parseInt(profile_data.employeeTypeId.toString()),
    profession: profile_data.profession ?? profile_data.professional,
    license: profile_data.license,
    receiveAlert: Boolean(profile_data.receiveAlert),
    status: mapLegacyAdminStatus(profile_data.status),
    roleId: nextRoleId,
  };

  if (isSuperAdmin && profile_data.scopeLevel) {
    const scopeLevel = profile_data.scopeLevel as AdminDataScope;
    const zoneId =
      profile_data.zoneId != null && profile_data.zoneId !== 0
        ? Number(profile_data.zoneId)
        : null;
    const affiliationId =
      profile_data.affiliationId != null &&
      Number(profile_data.affiliationId) !== 0
        ? Number(profile_data.affiliationId)
        : null;
    let healthcareFacilityId: string | null =
      profile_data.healthcareFacilityId?.trim() || null;

    if (!healthcareFacilityId && profile_data.agency) {
      const facility = await prisma.healthcareFacility.findFirst({
        where: { name: profile_data.agency },
        select: { id: true },
      });

      if (facility) healthcareFacilityId = facility.id;
    }

    const anchorCheck = validateScopeAnchors({
      scopeLevel,
      zoneId,
      affiliationId,
      healthcareFacilityId,
    });

    if (!anchorCheck.ok) {
      return Response.json({ error: anchorCheck.error }, { status: 400 });
    }

    updateData.scopeLevel = scopeLevel;
    updateData.zoneId = zoneId;
    updateData.affiliationId = affiliationId;
    updateData.healthcareFacilityId = healthcareFacilityId;
  } else if (existing.scopeLevel === AdminDataScope.FACILITY) {
    const affiliationId = Number(profile_data.affiliationId);

    if (!affiliationId) {
      return Response.json({ error: "กรุณาเลือกสังกัด" }, { status: 400 });
    }

    updateData.affiliationId = affiliationId;

    if (profile_data.healthcareFacilityId) {
      updateData.healthcareFacilityId = profile_data.healthcareFacilityId;
    } else if (profile_data.agency) {
      const facility = await prisma.healthcareFacility.findFirst({
        where: { name: profile_data.agency },
        select: { id: true },
      });

      if (facility) {
        updateData.healthcareFacilityId = facility.id;
      }
    }

    if (!updateData.healthcareFacilityId) {
      return Response.json(
        { error: "healthcareFacilityId is required" },
        { status: 400 }
      );
    }
  }
  // Elevated scopes: non-SUPERADMIN keeps org anchors as stored (no overwrite)

  const healthcareFacilityId =
    (updateData.healthcareFacilityId as string | null | undefined) !== undefined
      ? (updateData.healthcareFacilityId as string | null)
      : existing.healthcareFacilityId;
  const rawUnit = profile_data.facilityUnitId;
  let facilityUnitId: number | null = null;

  if (healthcareFacilityId && rawUnit != null && rawUnit !== 0) {
    const parsed =
      typeof rawUnit === "number" ? rawUnit : parseInt(String(rawUnit), 10);

    if (!Number.isNaN(parsed) && parsed > 0) {
      const unit = await prisma.facilityUnit.findFirst({
        where: {
          id: parsed,
          healthcareFacilityId,
          status: true,
        },
        select: { id: true },
      });

      if (!unit) {
        return Response.json(
          { error: "หน่วยงานย่อยไม่ตรงกับหน่วยงานที่เลือก" },
          { status: 400 }
        );
      }

      facilityUnitId = unit.id;
    }
  }

  updateData.facilityUnitId = facilityUnitId;

  await prisma.profileAdmin.update({
    where: {
      id: profile_data.id,
    },
    data: updateData,
  });

  return Response.json({ success: true });
}
