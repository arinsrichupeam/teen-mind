import { NextResponse } from "next/server";

import { prisma } from "@/utils/prisma";

// Update Profile -> HN -> Update Question Status
export async function PATCH(req: Request) {
  const data = await req.json();

  if (data.hn !== "") {
    const profile = await prisma.profile
      .update({
        where: {
          id: data.id,
        },
        data: {
          hn: data.hn,
        },
        select: {
          id: true,
          userId: true,
        },
      })
      .then((val) => {
        return val;
      });

    await prisma.questions_Master.updateMany({
      where: {
        profileId: profile.id,
        status: 0,
      },
      data: {
        status: 1,
      },
    });
  }

  return new Response("Success");
}

export async function GET() {
  const users = await prisma.profile.findMany({
    include: {
      school: true,
      questions: {
        select: {
          id: true,
        },
      },
    },
  });

  return NextResponse.json(users);
}
