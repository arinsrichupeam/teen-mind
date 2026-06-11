import { requireReferent } from "@/lib/get-session";
import {
  profileHasLineLinked,
  validateCitizenIdFormat,
} from "@/lib/profile-utils";
import { prisma } from "@/utils/prisma";

const HAS_LINE_MESSAGE =
  'ผู้รับการประเมินรายนี้เชื่อมต่อ LINE แล้ว กรุณาให้ทำแบบประเมินด้วยตนเองที่เมนู "แบบทดสอบของฉัน" หรือติดต่อผู้ดูแลระบบ';

export async function POST(req: Request) {
  const referentAuth = await requireReferent();

  if (!referentAuth) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let citizenId: string;

  try {
    const body = await req.json();

    citizenId =
      typeof body?.citizenId === "string" ? body.citizenId.trim() : "";
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const formatError = validateCitizenIdFormat(citizenId);

  if (formatError) {
    return Response.json({ error: formatError }, { status: 400 });
  }

  const profile = await prisma.profile.findUnique({
    where: { citizenId },
    select: {
      id: true,
      firstname: true,
      lastname: true,
      birthday: true,
      userId: true,
    },
  });

  if (!profile) {
    return Response.json({ status: "not_found" });
  }

  const hasLine = await profileHasLineLinked(profile.userId);

  if (hasLine) {
    return Response.json({
      status: "has_line",
      message: HAS_LINE_MESSAGE,
    });
  }

  return Response.json({
    status: "found",
    referentId: referentAuth.referent.id,
    profile: {
      id: profile.id,
      firstname: profile.firstname,
      lastname: profile.lastname,
      birthday: profile.birthday,
    },
  });
}
