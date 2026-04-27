import {
  Prisma,
  Questions_8Q,
  Questions_9Q,
  Questions_PHQA,
  Questions_PHQA_Addon,
} from "@prisma/client";

import {
  isAllFollowUpRoundsComplete,
  isConsultTelemedRoundComplete,
} from "../../../lib/question-followup-rounds";

import { getSession, requireAdmin } from "@/lib/get-session";
import { prisma } from "@/utils/prisma";
import { LocationData, QuestionPayload, QuestionsData } from "@/types";
import lineSdk from "@/utils/linesdk";
import {
  GreenFlex,
  RedFlex,
  YellowFlex,
  GreenLowFlex,
  OrangeFlex,
  getEmergencyAlertFlex,
} from "@/config/line-flex";
import {
  getNineQRiskLevel,
  getNineQRiskText,
  getPhqaRiskLevel,
  getPhqaRiskText,
} from "@/utils/helper";

function buildWhereFromQuery(url: URL) {
  const search = url.searchParams.get("search")?.trim() || "";
  const statusParam = url.searchParams.get("status");
  const school = url.searchParams.get("school")?.trim() || "";
  const referentCitizenId =
    url.searchParams.get("referentCitizenId")?.trim() || "";
  const consultUserId = url.searchParams.get("consult")?.trim() || "";
  const resultParam = url.searchParams.get("result");
  const resultNineqParam = url.searchParams.get("resultNineq");
  const resultPhqaParam = url.searchParams.get("resultPhqa");
  const q2Risk = url.searchParams.get("q2Risk");
  const addonRisk = url.searchParams.get("addonRisk");
  const q8Risk = url.searchParams.get("q8Risk");
  const mainScale = url.searchParams.get("mainScale")?.trim() || "";

  const statusArray =
    statusParam && statusParam !== "all"
      ? statusParam
          .split(",")
          .map((s) => parseInt(s.trim(), 10))
          .filter((n) => !Number.isNaN(n))
      : [];
  const resultArray = resultParam
    ? resultParam
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean)
    : [];
  const resultNineqArray = resultNineqParam
    ? resultNineqParam
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean)
    : [];
  const resultPhqaArray = resultPhqaParam
    ? resultPhqaParam
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean)
    : [];

  const whereConditions: Record<string, unknown>[] = [];

  const profileConditions: Record<string, unknown>[] = [];

  if (search) {
    profileConditions.push({
      OR: [
        { firstname: { contains: search } },
        { lastname: { contains: search } },
      ],
    });
  }
  if (school) {
    profileConditions.push({ school: { name: school } });
  }
  if (profileConditions.length === 1) {
    whereConditions.push({ profile: profileConditions[0] });
  } else if (profileConditions.length > 1) {
    whereConditions.push({ profile: { AND: profileConditions } });
  }

  if (statusArray.length > 0) {
    whereConditions.push({ status: { in: statusArray } });
  }

  if (referentCitizenId) {
    whereConditions.push({
      referent: { citizenId: referentCitizenId },
    });
  }

  if (consultUserId) {
    whereConditions.push({ consult: consultUserId });
  }

  const hasSplitMainResult =
    resultNineqArray.length > 0 || resultPhqaArray.length > 0;

  if (hasSplitMainResult) {
    const mainResultOr: Record<string, unknown>[] = [];

    if (resultNineqArray.length > 0) {
      mainResultOr.push({
        AND: [{ q9: { some: {} } }, { result: { in: resultNineqArray } }],
      });
    }

    if (resultPhqaArray.length > 0) {
      mainResultOr.push({
        AND: [
          { NOT: { q9: { some: {} } } },
          { result: { in: resultPhqaArray } },
        ],
      });
    }

    if (mainResultOr.length === 1) {
      whereConditions.push(mainResultOr[0]);
    } else {
      whereConditions.push({ OR: mainResultOr });
    }
  } else if (resultArray.length > 0) {
    whereConditions.push({ result: { in: resultArray } });
  }

  if (q2Risk === "risk") {
    whereConditions.push({
      q2: { some: { OR: [{ q1: 1 }, { q2: 1 }] } },
    });
  } else if (q2Risk === "no-risk") {
    whereConditions.push({
      NOT: { q2: { some: { OR: [{ q1: 1 }, { q2: 1 }] } } },
    });
  }

  if (addonRisk === "risk") {
    whereConditions.push({
      addon: { some: { OR: [{ q1: 1 }, { q2: 1 }] } },
    });
  } else if (addonRisk === "no-risk") {
    whereConditions.push({
      NOT: { addon: { some: { OR: [{ q1: 1 }, { q2: 1 }] } } },
    });
  }

  /** 8Q: พบความเสี่ยงเมื่อ sum > 0 (สอดคล้องหน้า admin คอลัมน์ 8Q) */
  if (q8Risk === "risk") {
    whereConditions.push({
      q8: { some: { sum: { gt: 0 } } },
    });
  } else if (q8Risk === "no-risk") {
    whereConditions.push({
      NOT: { q8: { some: { sum: { gt: 0 } } } },
    });
  }

  /** แยกชุดคำถามหลัก: 9Q (มีแถว q9) กับ PHQ-A เด็กเล็ก (ไม่มี q9) */
  if (mainScale === "nineq") {
    whereConditions.push({ q9: { some: {} } });
  } else if (mainScale === "phqa") {
    whereConditions.push({ NOT: { q9: { some: {} } } });
  }

  if (whereConditions.length === 0) return undefined;
  if (whereConditions.length === 1) return whereConditions[0];

  return { AND: whereConditions };
}

export async function GET(req: Request) {
  const auth = await requireAdmin();

  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const pageParam = url.searchParams.get("page");
  const limitParam = url.searchParams.get("limit");

  const page =
    Number.isNaN(Number(pageParam)) || !pageParam ? 1 : Number(pageParam);
  const limit =
    Number.isNaN(Number(limitParam)) || !limitParam
      ? 200
      : Math.min(Math.max(Number(limitParam), 10), 2000);

  const skip = (page - 1) * limit;
  const where = buildWhereFromQuery(url);

  const [questionsList, total] = await Promise.all([
    prisma.questions_Master.findMany({
      skip,
      take: limit,
      ...(where && { where }),
      select: {
        id: true,
        createdAt: true,
        result: true,
        result_text: true,
        status: true,
        consult: true,
        consult2: true,
        consult3: true,
        schedule_telemed: true,
        schedule_telemed2: true,
        schedule_telemed3: true,
        referentId: true,
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
        close_case_reason: true,
        follow_up: true,
        follow_up2: true,
        follow_up3: true,
        profile: {
          select: {
            id: true,
            userId: true,
            prefixId: true,
            firstname: true,
            lastname: true,
            birthday: true,
            citizenId: true,
            tel: true,
            hn: true,
            gradeYear: true,
            sex: true,
            school: {
              select: {
                id: true,
                name: true,
                districtId: true,
                screeningDate: true,
              },
            },
            emergency: {
              select: {
                id: true,
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
        referent: {
          select: {
            id: true,
            citizenId: true,
            firstname: true,
            lastname: true,
          },
        },
        phqa: {
          select: {
            q1: true,
            q2: true,
            q3: true,
            q4: true,
            q5: true,
            q6: true,
            q7: true,
            q8: true,
            q9: true,
            sum: true,
          },
        },
        q2: {
          select: {
            q1: true,
            q2: true,
          },
        },
        addon: {
          select: {
            q1: true,
            q2: true,
          },
        },
        q8: {
          select: {
            q1: true,
            q2: true,
            q3: true,
            q4: true,
            q5: true,
            q6: true,
            q7: true,
            q8: true,
            q8Addon: true,
            sum: true,
          },
        },
        q9: {
          select: {
            q1: true,
            q2: true,
            q3: true,
            q4: true,
            q5: true,
            q6: true,
            q7: true,
            q8: true,
            q9: true,
            sum: true,
          },
        },
        problem: {
          select: {
            familyRelation: true,
            familyStudyPressure: true,
            familyConflict: true,
            familyAbuse: true,
            familyLoss: true,
            socialFriendIssue: true,
            socialBullying: true,
            socialBreakup: true,
            socialTeacher: true,
            socialAssault: true,
            studyStress: true,
            studyNoMotivation: true,
            studyBurnout: true,
            studyTimeManage: true,
            studyHomeworkLoad: true,
            studyExamAnxiety: true,
            financeFamilyIssue: true,
            lifestyleSocialMediaOveruse: true,
            lifestyleGamingAddiction: true,
            lifestyleSubstanceUse: true,
            lifestyleEatingIssue: true,
            lifestyleBodyImageConcern: true,
            lifestyleInsomnia: true,
            sum: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.questions_Master.count(where ? { where } : undefined),
  ]);

  return Response.json({
    questionsList,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(req: Request) {
  const session = await getSession();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();

    // ตรวจสอบความถูกต้องของข้อมูล
    validateQuestionData(data);

    const profileId = data.profileId;
    const referenceId = data.reference;
    const Q2_data: Questions_PHQA_Addon = data.Q2;
    const location_data: LocationData | null = data.location;

    const phqa_data = data.phqa as Questions_PHQA | undefined;
    const phqaAddon_data = data.phqaAddon as Questions_PHQA_Addon | undefined;
    const q9_data = data.q9 as Questions_9Q | undefined;
    const q8_data = data.q8 as Questions_8Q;
    const problem_data = data.problem as
      | (Record<string, number> & { sum?: number })
      | undefined;

    const scoreSum = q9_data
      ? SumValue9Q(q9_data)
      : SumValue(phqa_data as Questions_PHQA);
    const q8_sum = SumValue8Q(q8_data);

    const { result, result_text } = calculateMainAssessmentResult(
      scoreSum,
      q9_data ? "9Q" : "PHQA"
    );

    // ดึงข้อมูลผู้ใช้ (รวมชื่อ-เบอร์ สำหรับแจ้งเตือน admin เมื่อ Red)
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      select: {
        userId: true,
        hn: true,
        firstname: true,
        lastname: true,
        tel: true,
      },
    });

    if (!profile) {
      throw new Error("ไม่พบข้อมูลผู้ใช้");
    }

    if (profile.userId && profile.userId !== session.user.id) {
      return Response.json(
        { error: "Forbidden: ไม่สามารถสร้างแบบประเมินแทนผู้ใช้อื่นได้" },
        { status: 403 }
      );
    }

    let lineUserId: string | undefined;

    if (profile.userId) {
      const UUID = await prisma.user.findUnique({
        where: { id: profile.userId as string },
        select: {
          accounts: {
            select: {
              provider: true,
              providerAccountId: true,
            },
            where: {
              provider: "line",
            },
          },
        },
      });

      lineUserId = UUID?.accounts?.[0]?.providerAccountId;
    }

    const status = profile.hn ? 1 : 0;

    // บันทึกข้อมูลลงฐานข้อมูล
    const createPayload: Prisma.Questions_MasterUncheckedCreateInput = {
      latitude: location_data?.latitude,
      longitude: location_data?.longitude,
      referentId: referenceId,
      result: result,
      result_text: result_text,
      status: status,
      profileId: profileId,
      q2: {
        create: {
          q1: Q2_data.q1,
          q2: Q2_data.q2,
        },
      },
      q8: {
        create: {
          q1: q8_data.q1,
          q2: q8_data.q2,
          q3: q8_data.q3,
          q4: q8_data.q4,
          q5: q8_data.q5,
          q6: q8_data.q6,
          q7: q8_data.q7,
          q8: q8_data.q8,
          q8Addon: q8_data.q8Addon,
          sum: q8_sum,
        },
      },
    };

    if (problem_data) {
      const normalizedProblemSum = calculateProblemSum(problem_data);

      createPayload.problem = {
        create: {
          familyRelation: Number(problem_data.familyRelation ?? 0),
          familyStudyPressure: Number(problem_data.familyStudyPressure ?? 0),
          familyConflict: Number(problem_data.familyConflict ?? 0),
          familyAbuse: Number(problem_data.familyAbuse ?? 0),
          familyLoss: Number(problem_data.familyLoss ?? 0),
          socialFriendIssue: Number(problem_data.socialFriendIssue ?? 0),
          socialBullying: Number(problem_data.socialBullying ?? 0),
          socialBreakup: Number(problem_data.socialBreakup ?? 0),
          socialTeacher: Number(problem_data.socialTeacher ?? 0),
          socialAssault: Number(problem_data.socialAssault ?? 0),
          studyStress: Number(problem_data.studyStress ?? 0),
          studyNoMotivation: Number(problem_data.studyNoMotivation ?? 0),
          studyBurnout: Number(problem_data.studyBurnout ?? 0),
          studyTimeManage: Number(problem_data.studyTimeManage ?? 0),
          studyHomeworkLoad: Number(problem_data.studyHomeworkLoad ?? 0),
          studyExamAnxiety: Number(problem_data.studyExamAnxiety ?? 0),
          financeFamilyIssue: Number(problem_data.financeFamilyIssue ?? 0),
          lifestyleSocialMediaOveruse: Number(
            problem_data.lifestyleSocialMediaOveruse ?? 0
          ),
          lifestyleGamingAddiction: Number(
            problem_data.lifestyleGamingAddiction ?? 0
          ),
          lifestyleSubstanceUse: Number(
            problem_data.lifestyleSubstanceUse ?? 0
          ),
          lifestyleEatingIssue: Number(problem_data.lifestyleEatingIssue ?? 0),
          lifestyleBodyImageConcern: Number(
            problem_data.lifestyleBodyImageConcern ?? 0
          ),
          lifestyleInsomnia: Number(problem_data.lifestyleInsomnia ?? 0),
          sum: normalizedProblemSum,
        },
      };
    }

    if (q9_data) {
      // สร้าง q9 + สร้าง phqa/addon เพื่อไม่ให้หน้า admin ที่อิง phqa/addon พัง
      createPayload.q9 = {
        create: {
          q1: q9_data.q1,
          q2: q9_data.q2,
          q3: q9_data.q3,
          q4: q9_data.q4,
          q5: q9_data.q5,
          q6: q9_data.q6,
          q7: q9_data.q7,
          q8: q9_data.q8,
          q9: q9_data.q9,
          sum: scoreSum,
        },
      };

      createPayload.phqa = {
        create: {
          q1: q9_data.q1,
          q2: q9_data.q2,
          q3: q9_data.q3,
          q4: q9_data.q4,
          q5: q9_data.q5,
          q6: q9_data.q6,
          q7: q9_data.q7,
          q8: q9_data.q8,
          q9: q9_data.q9,
          sum: scoreSum,
        },
      };

      createPayload.addon = {
        create: {
          q1: 0,
          q2: 0,
        },
      };
    } else {
      // under12
      createPayload.phqa = {
        create: {
          q1: (phqa_data as Questions_PHQA).q1,
          q2: (phqa_data as Questions_PHQA).q2,
          q3: (phqa_data as Questions_PHQA).q3,
          q4: (phqa_data as Questions_PHQA).q4,
          q5: (phqa_data as Questions_PHQA).q5,
          q6: (phqa_data as Questions_PHQA).q6,
          q7: (phqa_data as Questions_PHQA).q7,
          q8: (phqa_data as Questions_PHQA).q8,
          q9: (phqa_data as Questions_PHQA).q9,
          sum: scoreSum,
        },
      };

      createPayload.addon = {
        create: {
          q1: (phqaAddon_data as Questions_PHQA_Addon).q1,
          q2: (phqaAddon_data as Questions_PHQA_Addon).q2,
        },
      };
    }

    const savedQuestion = await prisma.questions_Master.create({
      data: createPayload,
    });

    // ส่งข้อความผ่าน Line เฉพาะเมื่อมี userId
    if (lineUserId) {
      switch (result) {
        case "Green":
          await lineSdk.pushMessage(lineUserId, GreenFlex);
          break;
        case "Green-Low":
          await lineSdk.pushMessage(lineUserId, GreenLowFlex);
          break;
        case "Yellow":
          await lineSdk.pushMessage(lineUserId, YellowFlex);
          break;
        case "Orange":
          await lineSdk.pushMessage(lineUserId, OrangeFlex);
          break;
        case "Red":
          await lineSdk.pushMessage(lineUserId, RedFlex);
          break;
      }
    }

    // เมื่อผลประเมินเป็น Red: แจ้งเตือนไปยัง Line ของ admin ที่เปิดรับแจ้งเตือน (alert = true)
    if (result === "Red") {
      const adminsWithAlert = await prisma.profile_Admin.findMany({
        where: { alert: true },
        select: {
          userId: true,
        },
      });

      if (adminsWithAlert.length > 0) {
        const adminUserIds = adminsWithAlert.map((a) => a.userId);
        const adminLineAccounts = await prisma.account.findMany({
          where: {
            userId: { in: adminUserIds },
            provider: "line",
          },
          select: { providerAccountId: true },
        });

        const profileDisplayName =
          `${profile.firstname ?? ""} ${profile.lastname ?? ""}`.trim() ||
          "ไม่ระบุชื่อ";
        const profileTel = profile.tel ?? "ไม่ระบุเบอร์";
        const baseUrl = (process.env.NEXTAUTH_URL ?? "").replace(/\/$/, "");
        const alertCaseUrl = baseUrl
          ? `${baseUrl}/admin/alert/${savedQuestion.id}`
          : undefined;
        const adminAlertMessage = getEmergencyAlertFlex(
          profileDisplayName,
          profileTel,
          alertCaseUrl
        );

        await Promise.allSettled(
          adminLineAccounts.map((account) =>
            lineSdk.pushMessage(account.providerAccountId, adminAlertMessage)
          )
        );
      }
    }

    return Response.json({ success: true, data: savedQuestion });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "เกิดข้อผิดพลาดในการบันทึกข้อมูล" + error,
      },
      { status: 400 }
    );
  }
}

export async function PUT(req: Request) {
  const auth = await requireAdmin();

  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    const question: QuestionsData = data;

    const { sum: mainScreeningSum, scale } = getMainScreeningData(question);
    const { result, result_text } = calculateMainAssessmentResult(
      mainScreeningSum,
      scale
    );

    // อัปเดตข้อมูลหลัก
    const updatedQuestion = await prisma.questions_Master.update({
      where: {
        id: question.id,
      },
      data: {
        consult: question.consult,
        consult2: question.consult2,
        consult3: question.consult3,
        schedule_telemed: question.schedule_telemed,
        schedule_telemed2: question.schedule_telemed2,
        schedule_telemed3: question.schedule_telemed3,
        subjective: question.subjective,
        subjective2: question.subjective2,
        subjective3: question.subjective3,
        objective: question.objective,
        objective2: question.objective2,
        objective3: question.objective3,
        assessment: question.assessment,
        assessment2: question.assessment2,
        assessment3: question.assessment3,
        plan: question.plan,
        plan2: question.plan2,
        plan3: question.plan3,
        note: question.note,
        note2: question.note2,
        note3: question.note3,
        close_case_reason: question.close_case_reason,
        follow_up: question.follow_up,
        follow_up2: question.follow_up2,
        follow_up3: question.follow_up3,
        status: CalStatus(question),
        result: result,
        result_text: result_text,
      },
    });

    const q2Promise =
      question.q2 && question.q2.length > 0
        ? (async () => {
            const existingQ2 = await prisma.questions_2Q.findFirst({
              where: {
                questions_MasterId: question.id,
              },
            });

            if (existingQ2) {
              await prisma.questions_2Q.updateMany({
                where: {
                  questions_MasterId: question.id,
                },
                data: {
                  q1: question.q2[0].q1,
                  q2: question.q2[0].q2,
                },
              });
            } else {
              await prisma.questions_2Q.create({
                data: {
                  questions_MasterId: question.id,
                  q1: question.q2[0].q1,
                  q2: question.q2[0].q2,
                },
              });
            }
          })()
        : Promise.resolve();

    const phqaPromise =
      question.phqa && question.phqa.length > 0
        ? (async () => {
            const existingPhqa = await prisma.questions_PHQA.findFirst({
              where: {
                questions_MasterId: question.id,
              },
            });

            if (existingPhqa) {
              await prisma.questions_PHQA.updateMany({
                where: {
                  questions_MasterId: question.id,
                },
                data: {
                  q1: question.phqa[0].q1,
                  q2: question.phqa[0].q2,
                  q3: question.phqa[0].q3,
                  q4: question.phqa[0].q4,
                  q5: question.phqa[0].q5,
                  q6: question.phqa[0].q6,
                  q7: question.phqa[0].q7,
                  q8: question.phqa[0].q8,
                  q9: question.phqa[0].q9,
                  sum: question.phqa[0].sum,
                },
              });
            } else {
              await prisma.questions_PHQA.create({
                data: {
                  questions_MasterId: question.id,
                  q1: question.phqa[0].q1,
                  q2: question.phqa[0].q2,
                  q3: question.phqa[0].q3,
                  q4: question.phqa[0].q4,
                  q5: question.phqa[0].q5,
                  q6: question.phqa[0].q6,
                  q7: question.phqa[0].q7,
                  q8: question.phqa[0].q8,
                  q9: question.phqa[0].q9,
                  sum: question.phqa[0].sum,
                },
              });
            }
          })()
        : Promise.resolve();

    const addonPromise =
      question.addon && question.addon.length > 0
        ? (async () => {
            const existingAddon = await prisma.questions_PHQA_Addon.findFirst({
              where: {
                questions_MasterId: question.id,
              },
            });

            if (existingAddon) {
              await prisma.questions_PHQA_Addon.updateMany({
                where: {
                  questions_MasterId: question.id,
                },
                data: {
                  q1: question.addon[0].q1,
                  q2: question.addon[0].q2,
                },
              });
            } else {
              await prisma.questions_PHQA_Addon.create({
                data: {
                  questions_MasterId: question.id,
                  q1: question.addon[0].q1,
                  q2: question.addon[0].q2,
                },
              });
            }
          })()
        : Promise.resolve();

    const q8Promise =
      question.q8 && question.q8.length > 0
        ? (async () => {
            const row = question.q8[0];
            const q8AddonStored = row.q3 === 6 ? row.q8Addon : 0;
            const q8_sum = SumValue8Q({
              ...row,
              q8Addon: q8AddonStored,
            } as Questions_8Q);

            const existingQ8 = await prisma.questions_8Q.findFirst({
              where: {
                questions_MasterId: question.id,
              },
            });

            if (existingQ8) {
              await prisma.questions_8Q.updateMany({
                where: {
                  questions_MasterId: question.id,
                },
                data: {
                  q1: row.q1,
                  q2: row.q2,
                  q3: row.q3,
                  q4: row.q4,
                  q5: row.q5,
                  q6: row.q6,
                  q7: row.q7,
                  q8: row.q8,
                  q8Addon: q8AddonStored,
                  sum: q8_sum,
                },
              });
            } else {
              await prisma.questions_8Q.create({
                data: {
                  questions_MasterId: question.id,
                  q1: row.q1,
                  q2: row.q2,
                  q3: row.q3,
                  q4: row.q4,
                  q5: row.q5,
                  q6: row.q6,
                  q7: row.q7,
                  q8: row.q8,
                  q8Addon: q8AddonStored,
                  sum: q8_sum,
                },
              });
            }
          })()
        : Promise.resolve();

    await Promise.all([q2Promise, phqaPromise, addonPromise, q8Promise]);

    return Response.json({
      success: true,
      message: "อัปเดตข้อมูลสำเร็จ",
      updatedQuestion,
    });
  } catch (err) {
    return Response.json(
      {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : "เกิดข้อผิดพลาดในการอัปเดตข้อมูล",
      },
      { status: 400 }
    );
  }
}

/** คะแนนชุดหลัก PHQ-A / 9Q สำหรับคำนวณระดับความเสี่ยง (รองรับทั้ง under12 และ over12) */
function getMainScreeningData(question: QuestionsData): {
  sum: number;
  scale: "PHQA" | "9Q";
} {
  const q9Row = question.q9?.[0];

  if (
    q9Row != null &&
    typeof q9Row.sum === "number" &&
    !Number.isNaN(q9Row.sum)
  ) {
    return { sum: q9Row.sum, scale: "9Q" };
  }

  const phqaRow = question.phqa?.[0];

  if (
    phqaRow != null &&
    typeof phqaRow.sum === "number" &&
    !Number.isNaN(phqaRow.sum)
  ) {
    return { sum: phqaRow.sum, scale: "PHQA" };
  }

  return { sum: 0, scale: "PHQA" };
}

function CalStatus(value: QuestionsData) {
  // status ความหมาย:
  // 1 = ยังไม่เริ่มติดตาม (อย่างน้อยต้องครบ schedule+consult รอบที่ 1)
  // 2 = เริ่มติดตามแล้ว (ครบ schedule+consult รอบที่ 1 แต่ยังไม่ครบทุกครั้ง)
  // 3 = ครบ “ครั้งติดตามที่ 1–3” (รวม Consultant/Telemed + Discharge Summary ต่อรอบ)
  if (isAllFollowUpRoundsComplete(value)) return 3;
  if (isConsultTelemedRoundComplete(value, 0)) return 2;

  return 1;
}

function SumValue(value: Questions_PHQA) {
  const { q1, q2, q3, q4, q5, q6, q7, q8, q9 } = value;

  const PHQA_SUM =
    Number(q1 ?? 0) +
    Number(q2 ?? 0) +
    Number(q3 ?? 0) +
    Number(q4 ?? 0) +
    Number(q5 ?? 0) +
    Number(q6 ?? 0) +
    Number(q7 ?? 0) +
    Number(q8 ?? 0) +
    Number(q9 ?? 0);

  return PHQA_SUM;
}

function SumValue9Q(value: Questions_9Q) {
  const { q1, q2, q3, q4, q5, q6, q7, q8, q9 } = value;

  return (
    Number(q1 ?? 0) +
    Number(q2 ?? 0) +
    Number(q3 ?? 0) +
    Number(q4 ?? 0) +
    Number(q5 ?? 0) +
    Number(q6 ?? 0) +
    Number(q7 ?? 0) +
    Number(q8 ?? 0) +
    Number(q9 ?? 0)
  );
}

function SumValue8Q(value: Questions_8Q) {
  // q1..q8 ตามฟิลด์ + q8Addon (เมื่อ q3=6); q3 เป็นคะแนนข้อ 3 (0 หรือ 6) ต้องรวมใน sum
  return (
    Number(value.q1 ?? 0) +
    Number(value.q2 ?? 0) +
    Number(value.q3 ?? 0) +
    Number(value.q4 ?? 0) +
    Number(value.q5 ?? 0) +
    Number(value.q6 ?? 0) +
    Number(value.q7 ?? 0) +
    Number(value.q8 ?? 0) +
    Number(value.q8Addon ?? 0)
  );
}

function getProblemKeys() {
  return [
    "familyRelation",
    "familyStudyPressure",
    "familyConflict",
    "familyAbuse",
    "familyLoss",
    "socialFriendIssue",
    "socialBullying",
    "socialBreakup",
    "socialTeacher",
    "socialAssault",
    "studyStress",
    "studyNoMotivation",
    "studyBurnout",
    "studyTimeManage",
    "studyHomeworkLoad",
    "studyExamAnxiety",
    "financeFamilyIssue",
    "lifestyleSocialMediaOveruse",
    "lifestyleGamingAddiction",
    "lifestyleSubstanceUse",
    "lifestyleEatingIssue",
    "lifestyleBodyImageConcern",
    "lifestyleInsomnia",
  ] as const;
}

function calculateProblemSum(problem: Record<string, number>) {
  const keys = getProblemKeys();

  return keys.reduce((acc, key) => acc + Number(problem[key] === 1), 0);
}

function validateProblem(problem?: Record<string, number>) {
  if (!problem) return;
  for (const key of getProblemKeys()) {
    const value = Number(problem[key] ?? 0);

    if (value !== 0 && value !== 1) {
      throw new Error(`ค่าประเมินปัญหา ${key} ไม่ถูกต้อง`);
    }
  }
}

function validateQuestionData(data: QuestionPayload) {
  if (!data.profileId) throw new Error("ข้อมูลไม่ครบถ้วน: profileId");
  if (!data.Q2) throw new Error("ข้อมูลไม่ครบถ้วน: Q2");
  if (!data.q8) throw new Error("ข้อมูลไม่ครบถ้วน: q8");
  validateProblem(
    (data as QuestionPayload & { problem?: Record<string, number> }).problem
  );

  // validate Q2 (0/1)
  if (data.Q2.q1 !== 0 && data.Q2.q1 !== 1) {
    throw new Error("ค่า 2Q q1 ไม่ถูกต้อง");
  }
  if (data.Q2.q2 !== 0 && data.Q2.q2 !== 1) {
    throw new Error("ค่า 2Q q2 ไม่ถูกต้อง");
  }

  // validate 8Q (ตามน้ำหนักที่ UI ส่งมา)
  const q8 = data.q8;
  const allowedQ8 = {
    q1: [0, 1],
    q2: [0, 2],
    q3: [0, 6],
    q4: [0, 8],
    q5: [0, 9],
    q6: [0, 5],
    q7: [0, 10],
    q8: [0, 4],
    q8Addon: [0, 8],
  };

  const checkAllowed = (key: keyof typeof allowedQ8, value: number) => {
    const ok = allowedQ8[key].includes(value);

    if (!ok) throw new Error(`ค่า 8Q ${String(key)} ไม่ถูกต้อง`);
  };

  checkAllowed("q1", q8.q1);
  checkAllowed("q2", q8.q2);
  checkAllowed("q3", q8.q3);
  checkAllowed("q4", q8.q4);
  checkAllowed("q5", q8.q5);
  checkAllowed("q6", q8.q6);
  checkAllowed("q7", q8.q7);
  checkAllowed("q8", q8.q8);

  if (q8.q3 === 6) {
    checkAllowed("q8Addon", q8.q8Addon);
  } else {
    // ถ้า q3 ไม่ใช่ (0) ไม่ควรมีค่า addon
    if (q8.q8Addon !== 0)
      throw new Error("ค่า 8Q q8Addon ไม่ถูกต้องเมื่อ q3 ไม่ใช่");
  }

  // validate path ตาม payload ที่ส่งมา
  if (data.q9) {
    const q9 = data.q9;

    for (let i = 1; i <= 9; i++) {
      const key = `q${i}` as keyof typeof q9;
      const value = q9[key] as unknown as number;

      if (value == null || value < 0 || value > 3) {
        throw new Error(`ค่า 9Q q${i} ไม่ถูกต้อง`);
      }
    }

    return;
  }

  // under12: ต้องมี phqa และ phqaAddon
  if (!data.phqa || !data.phqaAddon) {
    throw new Error("ข้อมูลไม่ครบถ้วนสำหรับ under12: phqa/phqaAddon");
  }

  for (let i = 1; i <= 9; i++) {
    const key = `q${i}` as keyof typeof data.phqa;
    const value = data.phqa[key] as unknown as number;

    if (value == null || value < 0 || value > 3) {
      throw new Error(`ค่า PHQA q${i} ไม่ถูกต้อง`);
    }
  }

  if (data.phqaAddon.q1 !== 0 && data.phqaAddon.q1 !== 1) {
    throw new Error("ค่า PHQA Addon q1 ไม่ถูกต้อง");
  }
  if (data.phqaAddon.q2 !== 0 && data.phqaAddon.q2 !== 1) {
    throw new Error("ค่า PHQA Addon q2 ไม่ถูกต้อง");
  }
}

// แยกฟังก์ชันคำนวณผลลัพธ์ตามแบบประเมินหลัก
function calculateMainAssessmentResult(sum: number, scale: "PHQA" | "9Q") {
  const result =
    scale === "9Q" ? getNineQRiskLevel(sum) : getPhqaRiskLevel(sum);
  const result_text =
    scale === "9Q" ? getNineQRiskText(sum) : getPhqaRiskText(sum);

  return { result, result_text };
}
