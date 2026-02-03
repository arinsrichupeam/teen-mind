import { Profile_Admin } from "@prisma/client";

import { prisma } from "@/utils/prisma";

export async function GET() {
  return Response.json("GET request successful");
}

export async function POST(req: Request) {
  const data = await req.json();
  const admin: Profile_Admin = data.profile_admin;

  // Get UserProfile From DB
  const user = await prisma.user.findUnique({
    where: {
      id: admin.userId,
    },
    select: {
      profile_admin: true,
    },
  });

  if (user?.profile_admin.length) {
    // Update Profile — ไม่มีการอัปเดตใน branch นี้
  } else {
    await prisma.user.update({
      where: {
        id: admin.userId,
      },
      data: {
        profile_admin: {
          create: {
            citizenId: admin.citizenId,
            prefixId: parseInt(admin.prefixId.toString()),
            firstname: admin.firstname,
            lastname: admin.lastname,
            tel: admin.tel,
            affiliationId: parseInt(admin.affiliationId.toString()),
            agency: admin.agency,
            employeeTypeId: parseInt(admin.employeeTypeId.toString()),
            professional: admin.professional,
            license: admin.license,
            status: admin.status,
          },
        },
      },
    });
  }

  return new Response("Success");
}
