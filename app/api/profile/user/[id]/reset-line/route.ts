import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/get-session";
import { prisma } from "@/utils/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();

  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profileId = (await params).id;

  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    select: { id: true, userId: true },
  });

  if (!profile) {
    return NextResponse.json(
      { error: "ไม่พบข้อมูลผู้ใช้งาน" },
      { status: 404 }
    );
  }

  if (!profile.userId) {
    return NextResponse.json(
      { error: "ผู้ใช้งานนี้ยังไม่ได้เชื่อมต่อ LINE" },
      { status: 400 }
    );
  }

  const lineAccount = await prisma.account.findFirst({
    where: {
      userId: profile.userId,
      provider: "line",
    },
    select: { id: true },
  });

  if (!lineAccount) {
    return NextResponse.json(
      { error: "ไม่พบบัญชี LINE ที่เชื่อมต่อ" },
      { status: 400 }
    );
  }

  await prisma.profile.update({
    where: { id: profileId },
    data: { userId: null },
  });

  return NextResponse.json({ success: true });
}
