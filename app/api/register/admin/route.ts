import { Profile_Admin } from "@prisma/client";

import { getSession } from "@/lib/get-session";
import { prisma } from "@/utils/prisma";

export async function GET() {
  return Response.json("GET request successful");
}

/**
 * ลงทะเบียนเป็น admin (สร้าง Profile_Admin) — ต้องล็อกอินแล้ว และลงทะเบียนได้เฉพาะตัวเอง (session.user.id === admin.userId)
 */
export async function POST(req: Request) {
  const session = await getSession();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await req.json();
  const admin: Profile_Admin = data.profile_admin;

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
      profile_admin: true,
    },
  });

  if (user?.profile_admin.length) {
    // Update Profile — ไม่มีการอัปเดตใน branch นี้
  } else {
    await prisma.user.update({
      where: {
        id: userId,
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
