import { NextResponse } from "next/server";

import { prisma } from "@/utils/prisma";

export async function GET() {
  const manualUsers = await prisma.profile.findMany({
    where: {
      userId: null,
    },
  });

  return NextResponse.json(manualUsers);
}
