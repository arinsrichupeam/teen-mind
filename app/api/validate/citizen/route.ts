import { prisma } from "@/utils/prisma";

export async function POST(req: Request) {
  try {
    const { citizenId, source, excludeId } = await req.json();

    // ตรวจสอบรูปแบบเลขบัตรประชาชน
    if (!citizenId || citizenId.length !== 13) {
      return Response.json(
        { error: "กรอกเลขบัตรประชาชนไม่ครบถ้วน" },
        { status: 400 }
      );
    }

    const isDigit = /^[0-9]*$/.test(citizenId);

    if (!isDigit) {
      return Response.json(
        { error: "เลขบัตรประชาชนต้องเป็นตัวเลขเท่านั้น" },
        { status: 400 }
      );
    }

    // ตรวจสอบเลขตรวจสอบ
    let sum = 0;

    for (let i = 0; i < 12; i++) {
      sum += parseInt(citizenId.charAt(i)) * (13 - i);
    }
    const checksum = (11 - (sum % 11)) % 10;

    if (checksum !== parseInt(citizenId.charAt(12))) {
      return Response.json(
        { error: "กรอกเลขบัตรประชาชนไม่ถูกต้อง" },
        { status: 400 }
      );
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
        return Response.json(
          { error: "เลขบัตรประชาชนนี้มีอยู่ในระบบแล้ว" },
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
