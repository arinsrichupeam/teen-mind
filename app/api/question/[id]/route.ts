import type { QuestionsData } from "@/types";

import { getFollowUpRoundStatuses } from "../../../../lib/question-followup-rounds";

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
      subjective2: true,
      subjective3: true,
      objective: true,
      objective2: true,
      objective3: true,
      assessment: true,
      assessment2: true,
      assessment3: true,
      plan: true,
      plan2: true,
      plan3: true,
      note: true,
      note2: true,
      note3: true,
      schedule_telemed: true,
      schedule_telemed2: true,
      schedule_telemed3: true,
      follow_up: true,
      follow_up2: true,
      follow_up3: true,
      consult: true,
      consult2: true,
      consult3: true,
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
              name: true,
            },
          },
        },
      },
      phqa: true,
      q2: true,
      addon: true,
      q8: true,
      q9: true,
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

  const payload = {
    ...question,
    followUpRoundStatuses: getFollowUpRoundStatuses(
      question as unknown as QuestionsData
    ),
  };

  return Response.json(payload);
}
