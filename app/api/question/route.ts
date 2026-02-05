import { Questions_PHQA, Questions_PHQA_Addon } from "@prisma/client";

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
import { getPhqaRiskLevel, getPhqaRiskText } from "@/utils/helper";

function buildWhereFromQuery(url: URL) {
  const search = url.searchParams.get("search")?.trim() || "";
  const statusParam = url.searchParams.get("status");
  const school = url.searchParams.get("school")?.trim() || "";
  const referentCitizenId =
    url.searchParams.get("referentCitizenId")?.trim() || "";
  const consultUserId = url.searchParams.get("consult")?.trim() || "";
  const resultParam = url.searchParams.get("result");
  const q2Risk = url.searchParams.get("q2Risk");
  const addonRisk = url.searchParams.get("addonRisk");

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

  if (resultArray.length > 0) {
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
        schedule_telemed: true,
        referentId: true,
        subjective: true,
        objective: true,
        assessment: true,
        plan: true,
        follow_up: true,
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
    const phqa_data: Questions_PHQA = data.phqa;
    const Q2_data: Questions_PHQA_Addon = data.Q2;
    const phqaAddon_data: Questions_PHQA_Addon = data.phqaAddon;
    const location_data: LocationData = data.location;

    const phqa_sum = SumValue(phqa_data);
    const { result, result_text } = calculateResult(phqa_sum);

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
    const savedQuestion = await prisma.questions_Master.create({
      data: {
        latitude: location_data?.latitude,
        longitude: location_data?.longitude,
        referentId: referenceId,
        result: result,
        result_text: result_text,
        status: status,
        profileId: profileId,
        phqa: {
          create: {
            q1: phqa_data.q1,
            q2: phqa_data.q2,
            q3: phqa_data.q3,
            q4: phqa_data.q4,
            q5: phqa_data.q5,
            q6: phqa_data.q6,
            q7: phqa_data.q7,
            q8: phqa_data.q8,
            q9: phqa_data.q9,
            sum: phqa_sum,
          },
        },
        q2: {
          create: {
            q1: Q2_data.q1,
            q2: Q2_data.q2,
          },
        },
        addon: {
          create: {
            q1: phqaAddon_data.q1,
            q2: phqaAddon_data.q2,
          },
        },
      },
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

    const { result, result_text } = calculateResult(question.phqa[0].sum);

    // อัปเดตข้อมูลหลัก
    const updatedQuestion = await prisma.questions_Master.update({
      where: {
        id: question.id,
      },
      data: {
        consult: question.consult,
        schedule_telemed: question.schedule_telemed,
        subjective: question.subjective,
        objective: question.objective,
        assessment: question.assessment,
        plan: question.plan,
        follow_up: question.follow_up,
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

    await Promise.all([q2Promise, phqaPromise, addonPromise]);

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

function CalStatus(value: QuestionsData) {
  if (value.schedule_telemed != null && value.consult != null) {
    if (
      value.subjective != null &&
      value.objective != null &&
      value.assessment != null &&
      value.plan != null
    ) {
      return 3;
    }

    return 2;
  }

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

function validateQuestionData(data: QuestionPayload) {
  if (!data.profileId || !data.phqa || !data.Q2 || !data.phqaAddon) {
    throw new Error("ข้อมูลไม่ครบถ้วน");
  }

  for (let i = 1; i <= 9; i++) {
    const key = `q${i}` as keyof QuestionPayload["phqa"];
    const value = data.phqa[key];

    if (value == null || value < 0 || value > 3) {
      throw new Error(`ค่า PHQA q${i} ไม่ถูกต้อง`);
    }
  }

  if (data.Q2.q1 !== 0 && data.Q2.q1 !== 1) {
    throw new Error("ค่า 2Q q1 ไม่ถูกต้อง");
  }
  if (data.Q2.q2 !== 0 && data.Q2.q2 !== 1) {
    throw new Error("ค่า 2Q q2 ไม่ถูกต้อง");
  }

  if (data.phqaAddon.q1 !== 0 && data.phqaAddon.q1 !== 1) {
    throw new Error("ค่า PHQA Addon q1 ไม่ถูกต้อง");
  }
  if (data.phqaAddon.q2 !== 0 && data.phqaAddon.q2 !== 1) {
    throw new Error("ค่า PHQA Addon q2 ไม่ถูกต้อง");
  }
}

// แยกฟังก์ชันคำนวณผลลัพธ์
function calculateResult(phqa_sum: number) {
  const result = getPhqaRiskLevel(phqa_sum);
  const result_text = getPhqaRiskText(phqa_sum);

  return { result, result_text };
}
