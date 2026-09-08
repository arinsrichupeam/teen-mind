import { ProfileAdminData } from "@/types";
import { prisma } from "@/utils/prisma";
import { requireAdmin } from "@/lib/get-session";
import { mapLegacyAdminStatus } from "@/lib/legacy-value-mapping";

export async function GET() {
  const auth = await requireAdmin();

  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await prisma.profileAdmin.findMany({
    include: {
      user: {
        select: {
          image: true,
        },
      },
      role: {
        select: {
          id: true,
          name: true,
        },
      },
      healthcareFacility: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return Response.json(data);
}

export async function POST(req: Request) {
  const auth = await requireAdmin();

  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await req.json();
  const profile_data: ProfileAdminData = data.profile_data;

  const updateData: Record<string, unknown> = {
    prefixId: parseInt(profile_data.prefixId.toString()),
    firstName: profile_data.firstName,
    lastName: profile_data.lastName,
    affiliationId: parseInt(profile_data.affiliationId.toString()),
    phone: profile_data.phone,
    employeeTypeId: parseInt(profile_data.employeeTypeId.toString()),
    profession: profile_data.profession ?? profile_data.professional,
    license: profile_data.license,
    receiveAlert: profile_data.receiveAlert,
    status: mapLegacyAdminStatus(profile_data.status),
    roleId: parseInt(profile_data.roleId.toString()),
  };

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

  await prisma.profileAdmin.update({
    where: {
      id: profile_data.id,
    },
    data: updateData,
  });

  return Response.json("Success");
}
