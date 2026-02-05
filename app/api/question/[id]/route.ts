import { prisma } from "@/utils/prisma";
import { getSession, requireAdmin } from "@/lib/get-session";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const questionId = (await params).id;

  const question = await prisma.questions_Master.findUnique({
    where: { id: questionId },
    select: {
      id: true,
      result: true,
      result_text: true,
      latitude: true,
      longitude: true,
      createdAt: true,
      subjective: true,
      objective: true,
      assessment: true,
      plan: true,
      schedule_telemed: true,
      follow_up: true,
      consult: true,
      status: true,
      profile: {
        select: {
          id: true,
          userId: true,
          firstname: true,
          lastname: true,
          prefixId: true,
          sex: true,
          birthday: true,
          ethnicity: true,
          nationality: true,
          citizenId: true,
          tel: true,
          hn: true,
          school: {
            select: {
              id: true,
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
          emergency: {
            select: {
              name: true,
              tel: true,
              relation: true,
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
      q2: true,
      addon: true,
    },
  });

  if (!question) {
    return Response.json(null, { status: 404 });
  }

  const profileUserId = question.profile?.userId ?? null;
  const isOwner = profileUserId === session.user.id;
  const isAdmin = (await requireAdmin()) !== null;

  if (!isOwner && !isAdmin) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  return Response.json(question);
}
