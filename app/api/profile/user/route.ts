import { prisma } from "@/utils/prisma";

// Update Profile
// export async function PUT(req: Request) {
// const data = await req.json();
// }

// Update Profile -> HN -> Update Question Status
export async function PATCH(req: Request) {
  const data = await req.json();

  if (data.hn !== "") {
    const userId = await prisma.profile
      .update({
        where: {
          id: data.id,
        },
        data: {
          hn: data.hn,
        },
        select: {
          userId: true,
        },
      })
      .then((val) => {
        return val.userId;
      });

    await prisma.questions_Master.updateMany({
      where: {
        userId: userId,
        status: 0,
      },
      data: {
        status: 1,
      },
    });
  }

  return new Response("Success");
}
