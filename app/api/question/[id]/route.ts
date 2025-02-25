import { prisma } from "@/utils/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const questionId = (await params).id;

  const question = await prisma.questions_Master.findMany({
    where: {
      id: questionId,
    },
    select: {
      id: true,
      result: true,
      latitude: true,
      longitude: true,
      createdAt: true,
      User: {
        select: {
          image: true,
          profile: {
            select: {
              firstname: true,
              lastname: true,
              prefix: true,
              birthday: true,
              ethnicity: true,
              nationality: true,
              citizenId: true,
              tel: true,
              address: {
                select: {
                  houseNo: true,
                  villageNo: true,
                  soi: true,
                  road: true,
                  subdistrict: true,
                  district: true,
                  province: true,
                },
              },
            },
          },
        },
      },
      phqa: true,
      q2: true,
    },
  });

  return Response.json(question);
}
