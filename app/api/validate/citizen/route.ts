import {
  profileHasLineLinked,
  validateCitizenIdFormat,
} from "@/lib/profile-utils";
import { prisma } from "@/utils/prisma";

export async function POST(req: Request) {
  try {
    const { citizenId, source, excludeId } = await req.json();

    const formatError = validateCitizenIdFormat(citizenId);

    if (formatError) {
      return Response.json({ error: formatError }, { status: 400 });
    }

    // ตรวจสอบการซ้ำซ้อนตาม source
    if (source === "user") {
      const existingUser = await prisma.profile.findFirst({
        where: {
          citizenId,
          ...(excludeId && { id: { not: excludeId } }),
        },
      });

      if (existingUser) {
        const hasLineLinked = await profileHasLineLinked(existingUser.userId);

        if (!hasLineLinked) {
          return Response.json(
            {
              error: "เลขบัตรประชาชนนี้มีอยู่ในระบบแล้ว",
              canLinkLine: true,
              hasLineLinked: false,
            },
            { status: 409 }
          );
        }

        return Response.json(
          {
            error: "เลขบัตรประชาชนนี้มีอยู่ในระบบแล้ว",
            canLinkLine: false,
            hasLineLinked: true,
          },
          { status: 400 }
        );
      }
    } else if (source === "admin") {
      const existingAdmin = await prisma.profile_Admin.findFirst({
        where: {
          citizenId,
          ...(excludeId && { id: { not: excludeId } }),
        },
      });

      if (existingAdmin) {
        return Response.json(
          { error: "เลขบัตรประชาชนนี้มีอยู่ในระบบแล้ว" },
          { status: 400 }
        );
      }
    } else if (source === "referent") {
      const existingReferent = await prisma.referent.findFirst({
        where: {
          citizenId,
          ...(excludeId && { id: { not: excludeId } }),
        },
      });

      if (existingReferent) {
        return Response.json(
          { error: "เลขบัตรประชาชนนี้มีอยู่ในระบบแล้ว" },
          { status: 400 }
        );
      }
    }

    return Response.json({ valid: true });
  } catch (error) {
    return Response.json(
      { error: "เกิดข้อผิดพลาดในการตรวจสอบเลขบัตรประชาชน" + error },
      { status: 500 }
    );
  }
}
