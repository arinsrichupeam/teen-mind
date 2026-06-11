import { getSession } from "@/lib/get-session";
import { profileHasLineLinked } from "@/lib/profile-utils";
import { prisma } from "@/utils/prisma";

export async function POST(req: Request) {
  let session: Awaited<ReturnType<typeof getSession>> = null;

  try {
    session = await getSession();
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let citizenId: string;

  try {
    const body = await req.json();

    citizenId =
      typeof body?.citizenId === "string" ? body.citizenId.trim() : "";
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!citizenId || citizenId.length !== 13 || !/^[0-9]+$/.test(citizenId)) {
    return Response.json(
      { error: "เลขบัตรประชาชนไม่ถูกต้อง" },
      { status: 400 }
    );
  }

  const existingProfile = await prisma.profile.findUnique({
    where: { citizenId },
    select: { id: true, userId: true },
  });

  if (!existingProfile) {
    return Response.json({ error: "ไม่พบข้อมูลในระบบ" }, { status: 404 });
  }

  if (await profileHasLineLinked(existingProfile.userId)) {
    return Response.json(
      { error: "บัญชีนี้เชื่อมต่อ LINE แล้ว" },
      { status: 400 }
    );
  }

  const currentUserProfile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (currentUserProfile) {
    return Response.json(
      { error: "บัญชี LINE นี้มีโปรไฟล์แล้ว" },
      { status: 400 }
    );
  }

  const currentLineAccount = await prisma.account.findFirst({
    where: {
      userId: session.user.id,
      provider: "line",
    },
    select: { id: true },
  });

  if (!currentLineAccount) {
    return Response.json(
      {
        error: "กรุณาเข้าสู่ระบบด้วย LINE ก่อน",
        requiresLineSignIn: true,
      },
      { status: 400 }
    );
  }

  const updatedProfile = await prisma.profile.update({
    where: { id: existingProfile.id },
    data: { userId: session.user.id },
    select: { id: true },
  });

  return Response.json({
    success: true,
    profileId: updatedProfile.id,
  });
}
