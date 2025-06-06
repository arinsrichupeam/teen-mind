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
      subjective: true,
      objective: true,
      assessment: true,
      plan: true,
      schedule_telemed: true,
      consult: true,
      status: true,
      profile: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          prefixId: true,
          birthday: true,
          ethnicity: true,
          nationality: true,
          citizenId: true,
          tel: true,
          hn: true,
          school: {
            select: {
              name: true,
            },
          },
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
          user: {
            select: {
              image: true,
            },
          },
        },
      },
      phqa: true,
      addon: true,
    },
  });

  return Response.json(question);
}
