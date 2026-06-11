import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/utils/prisma";

/**
 * ดึง session ปัจจุบันสำหรับใช้ใน API Route หรือ Server Component
 * คืนค่า null ถ้าไม่ได้ล็อกอิน
 */
export async function getSession() {
  return getServerSession(authOptions);
}

/**
 * ตรวจสอบว่าเป็น admin (มี Profile_Admin) คืนค่า { session, adminProfile } หรือ null
 * ใช้สำหรับ API ที่เฉพาะ admin เข้าถึงได้
 */
export async function requireAdmin() {
  const session = await getSession();

  if (!session?.user?.id) return null;

  const adminProfile = await prisma.profile_Admin.findFirst({
    where: { userId: session.user.id },
  });

  return adminProfile ? { session, adminProfile } : null;
}

/**
 * ตรวจสอบว่าเป็นอสท. (มี Referent ที่ citizenId ตรงกับ Profile ของ session)
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

  const referent = await prisma.referent.findUnique({
    where: { citizenId: profile.citizenId },
    select: { id: true, firstname: true, lastname: true },
  });

  return referent ? { session, referent } : null;
}
