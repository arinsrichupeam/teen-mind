import { getSession } from "@/lib/get-session";
import { prisma } from "@/utils/prisma";

type ProblemPayload = {
  familyRelation: number;
  familyStudyPressure: number;
  familyConflict: number;
  familyAbuse: number;
  familyLoss: number;
  socialFriendIssue: number;
  socialBullying: number;
  socialBreakup: number;
  socialTeacher: number;
  socialAssault: number;
  studyStress: number;
  studyNoMotivation: number;
  studyBurnout: number;
  studyTimeManage: number;
  studyHomeworkLoad: number;
  studyExamAnxiety: number;
  financeFamilyIssue: number;
  lifestyleSocialMediaOveruse: number;
  lifestyleGamingAddiction: number;
  lifestyleSubstanceUse: number;
  lifestyleEatingIssue: number;
  lifestyleBodyImageConcern: number;
  lifestyleInsomnia: number;
  sum: number;
};

function validateProblemPayload(problem: ProblemPayload) {
  const values = Object.entries(problem);

  for (const [key, value] of values) {
    if (key === "sum") continue;
    if (value !== 0 && value !== 1) {
      throw new Error(`ข้อมูลปัญหาไม่ถูกต้อง: ${key}`);
    }
  }
}

export async function POST(req: Request) {
  const session = await getSession();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const questionId = body?.questionId as string | undefined;
    const problem = body?.problem as ProblemPayload | undefined;

    if (!questionId) {
      throw new Error("ไม่พบ questionId");
    }
    if (!problem) {
      throw new Error("ไม่พบข้อมูลปัญหา");
    }

    validateProblemPayload(problem);

    const question = await prisma.questions_Master.findUnique({
      where: { id: questionId },
      select: {
        id: true,
        profile: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!question) {
      return Response.json({ error: "ไม่พบแบบประเมิน" }, { status: 404 });
    }

    if (
      question.profile.userId &&
      question.profile.userId !== session.user.id
    ) {
      return Response.json(
        { error: "Forbidden: ไม่สามารถแก้ไขข้อมูลของผู้ใช้อื่นได้" },
        { status: 403 }
      );
    }

    const normalizedSum = Object.entries(problem).reduce(
      (acc, [key, value]) => {
        if (key === "sum") return acc;

        return acc + Number(value === 1);
      },
      0
    );

    const saved = await prisma.questions_Problem.upsert({
      where: {
        questions_MasterId: questionId,
      },
      update: {
        ...problem,
        sum: normalizedSum,
      },
      create: {
        questions_MasterId: questionId,
        ...problem,
        sum: normalizedSum,
      },
    });

    return Response.json({ success: true, data: saved });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
      },
      { status: 400 }
    );
  }
}
