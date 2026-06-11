import { prisma } from "@/utils/prisma";

export async function profileHasLineLinked(
  userId: string | null | undefined
): Promise<boolean> {
  if (!userId) {
    return false;
  }

  const lineAccount = await prisma.account.findFirst({
    where: {
      userId,
      provider: "line",
    },
    select: { id: true },
  });

  return lineAccount != null;
}

export function validateCitizenIdFormat(citizenId: string): string | null {
  if (!citizenId || citizenId.length !== 13) {
    return "กรอกเลขบัตรประชาชนไม่ครบถ้วน";
  }

  if (!/^[0-9]*$/.test(citizenId)) {
    return "เลขบัตรประชาชนต้องเป็นตัวเลขเท่านั้น";
  }

  let sum = 0;

  for (let i = 0; i < 12; i++) {
    sum += parseInt(citizenId.charAt(i), 10) * (13 - i);
  }
  const checksum = (11 - (sum % 11)) % 10;

  if (checksum !== parseInt(citizenId.charAt(12), 10)) {
    return "กรอกเลขบัตรประชาชนไม่ถูกต้อง";
  }

  return null;
}
