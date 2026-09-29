import { resolveDataScopeAnchor } from "@/lib/admin-data-scope";
import { ProfileAdminData } from "@/types";
import lineSdk from "@/utils/linesdk";
import { prisma } from "@/utils/prisma";
import { getSession, requireAdmin } from "@/lib/get-session";
import { mapAdminStatusToLegacyNumber } from "@/lib/legacy-value-mapping";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (await params).id;

  if (session.user.id !== userId) {
    const auth = await requireAdmin();

    if (!auth) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Get User From DB
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      accounts: {
        select: {
          userId: true,
          provider: true,
          providerAccountId: true,
        },
      },
    },
  });

  const lineAccount = user?.accounts.find((a) => a.provider === "line");

  // Update User LineName and image
  if (lineAccount) {
    const lineProfile = await lineSdk.getProfile(lineAccount.providerAccountId);

    await prisma.user.update({
      where: {
        id: lineAccount.userId,
      },
      data: {
        name: lineProfile.displayName,
        image: lineProfile.pictureUrl,
      },
    });
  }

  // Get AdminProfile
  const profile = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      image: true,
      name: true,
      accounts: {
        select: {
          providerAccountId: true,
        },
      },
      profileAdmins: {
        include: {
          role: true,
          healthcareFacility: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });

  if (profile && profile.profileAdmins.length > 0) {
    const admin = profile.profileAdmins[0];
    const facilitated = admin.healthcareFacilityId
      ? await prisma.zone.findFirst({
          where: {
            facilitatorFacilityId: admin.healthcareFacilityId,
            status: true,
          },
          select: { id: true, name: true },
        })
      : null;
    const effective = resolveDataScopeAnchor(admin, facilitated?.id ?? null);

    const result: ProfileAdminData = {
      id: admin.id as string,
      userId: admin.userId as string,
      providerAccountId: profile.accounts[0]?.providerAccountId as string,
      image: profile.image as string,
      name: profile.name as string,
      citizenId: admin.citizenId as string,
      prefixId: admin.prefixId as number,
      firstName: admin.firstName as string,
      lastName: admin.lastName as string,
      phone: (admin.phone as string) ?? "",
      affiliationId: admin.affiliationId,
      healthcareFacilityId: admin.healthcareFacilityId,
      agency: admin.healthcareFacility?.name ?? "",
      facilityUnitId: admin.facilityUnitId ?? null,
      scopeLevel: admin.scopeLevel,
      zoneId: admin.zoneId,
      effectiveScopeLevel: effective.scopeLevel,
      facilitatedZoneId: facilitated?.id ?? null,
      facilitatedZoneName: facilitated?.name ?? null,
      employeeTypeId: admin.employeeTypeId as number,
      profession: admin.profession as string,
      professional: admin.profession as string,
      license: (admin.license as string) ?? "",
      status: mapAdminStatusToLegacyNumber(admin.status),
      receiveAlert: admin.receiveAlert as boolean,
      roleId: admin.roleId as number,
      roleName: admin.role?.name ?? "",
      roleCode: admin.role?.code ?? "",
      createdAt: "",
      updatedAt: "",
    };

    return Response.json(result);
  }

  return Response.json(null);
}
