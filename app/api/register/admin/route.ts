import { AdminStatus, ProfileAdmin } from "@prisma/client";

import { getSession } from "@/lib/get-session";
import { mapLegacyAdminStatus } from "@/lib/legacy-value-mapping";
import { prisma } from "@/utils/prisma";

type AdminRegisterPayload = ProfileAdmin & {
  agency?: string;
  professional?: string;
};

async function resolveHealthcareFacilityId(
  healthcareFacilityId: string | undefined,
  agency: string | undefined,
  affiliationId: number
): Promise<string | null> {
  if (healthcareFacilityId?.trim()) {
    return healthcareFacilityId.trim();
  }

  if (agency?.trim()) {
    const byName = await prisma.healthcareFacility.findFirst({
      where: { name: agency.trim() },
      select: { id: true },
    });

    if (byName) return byName.id;

    // Placeholder facility when registering with free-text agency name
    const anyGeo = await prisma.province.findFirst({
      select: {
        id: true,
        districts: {
          take: 1,
          select: {
            id: true,
            subdistricts: { take: 1, select: { id: true } },
          },
        },
      },
    });
    const district = anyGeo?.districts[0];
    const subdistrict = district?.subdistricts[0];

    if (anyGeo && district && subdistrict) {
      const created = await prisma.healthcareFacility.create({
        data: {
          name: agency.trim(),
          provinceId: anyGeo.id,
          districtId: district.id,
          subdistrictId: subdistrict.id,
          affiliationId,
        },
        select: { id: true },
      });

      return created.id;
    }
  }

  const fallback = await prisma.healthcareFacility.findFirst({
    select: { id: true },
  });

  return fallback?.id ?? null;
}

export async function GET() {
  return Response.json("GET request successful");
}

/**
 * ลงทะเบียนเป็น admin (สร้าง ProfileAdmin) — ต้องล็อกอินแล้ว และลงทะเบียนได้เฉพาะตัวเอง (session.user.id === admin.userId)
 */
export async function POST(req: Request) {
  const session = await getSession();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await req.json();
  const admin: AdminRegisterPayload = data.profileAdmins;

  if (admin.userId && admin.userId !== session.user.id) {
    return Response.json(
      { error: "Forbidden: ไม่สามารถลงทะเบียนแทนผู้ใช้อื่นได้" },
      { status: 403 }
    );
  }

  const userId = admin.userId?.trim() || session.user.id;

  // Get UserProfile From DB
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      profileAdmins: true,
    },
  });

  if (user?.profileAdmins.length) {
    // Update Profile — ไม่มีการอัปเดตใน branch นี้
  } else {
    const affiliationId = parseInt(admin.affiliationId.toString());
    const healthcareFacilityId = await resolveHealthcareFacilityId(
      admin.healthcareFacilityId,
      admin.agency,
      affiliationId
    );

    if (!healthcareFacilityId) {
      return Response.json(
        { error: "ไม่พบหน่วยงาน (healthcare facility) สำหรับลงทะเบียน" },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        profileAdmins: {
          create: {
            citizenId: admin.citizenId,
            prefixId: parseInt(admin.prefixId.toString()),
            firstName: admin.firstName,
            lastName: admin.lastName,
            phone: admin.phone,
            affiliationId,
            healthcareFacilityId,
            employeeTypeId: parseInt(admin.employeeTypeId.toString()),
            profession: admin.profession ?? admin.professional,
            license: admin.license,
            status: mapLegacyAdminStatus(admin.status),
            roleId: admin.roleId ?? 3,
            receiveAlert: admin.receiveAlert ?? false,
          },
        },
      },
    });
  }

  return new Response("Success");
}
