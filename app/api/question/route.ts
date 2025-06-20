import { Questions_PHQA, Questions_PHQA_Addon } from "@prisma/client";

import { prisma } from "@/utils/prisma";
import { LocationData, QuestionsData } from "@/types";
import lineSdk from "@/utils/linesdk";
import { GreenFlex, RedFlex, YellowFlex } from "@/config/site";

export async function GET() {
  const questionsList = await prisma.questions_Master.findMany({
    select: {
      id: true,
      createdAt: true,
      result: true,
      result_text: true,
      status: true,
      consult: true,
      profile: {
        select: {
          id: true,
          prefixId: true,
          firstname: true,
          lastname: true,
          birthday: true,
          school: {
            select: {
              name: true,
            },
          },
        },
      },
      phqa: {
        select: {
          sum: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return Response.json({ questionsList });
}

export async function POST(req: Request) {
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
    const { result, result_text } = calculateResult(phqa_sum, phqa_data);

    // ดึงข้อมูลผู้ใช้
    const user = await prisma.profile.findUnique({
      where: { id: profileId },
      select: {
        userId: true,
        hn: true,
      },
    });

    if (!user) {
      throw new Error("ไม่พบข้อมูลผู้ใช้");
    }

    let lineUserId: string | undefined;

    if (user.userId) {
      const UUID = await prisma.user.findUnique({
        where: { id: user.userId as string },
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

    const status = user.hn ? 1 : 0;

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
        case "Yellow":
          await lineSdk.pushMessage(lineUserId, YellowFlex);
          break;
        case "Red":
          await lineSdk.pushMessage(lineUserId, RedFlex);
          break;
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
  try {
    const data = await req.json();
    const question: QuestionsData = data;
    const phqaForCalculation = {
      id: "",
      questions_MasterId: null,
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
    };
    const { result, result_text } = calculateResult(
      question.phqa[0].sum,
      phqaForCalculation
    );

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

    // อัปเดตข้อมูล q2 ถ้ามี
    if (question.q2 && question.q2.length > 0) {
      const existingQ2 = await prisma.questions_2Q.findFirst({
        where: {
          questions_MasterId: question.id,
        },
      });

      if (existingQ2) {
        // อัปเดตข้อมูลที่มีอยู่
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
        // สร้างข้อมูลใหม่
        await prisma.questions_2Q.create({
          data: {
            questions_MasterId: question.id,
            q1: question.q2[0].q1,
            q2: question.q2[0].q2,
          },
        });
      }
    }

    // อัปเดตข้อมูล phqa ถ้ามี
    if (question.phqa && question.phqa.length > 0) {
      const existingPhqa = await prisma.questions_PHQA.findFirst({
        where: {
          questions_MasterId: question.id,
        },
      });

      if (existingPhqa) {
        // อัปเดตข้อมูลที่มีอยู่
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
        // สร้างข้อมูลใหม่
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
    }

    // อัปเดตข้อมูล addon ถ้ามี
    if (question.addon && question.addon.length > 0) {
      const existingAddon = await prisma.questions_PHQA_Addon.findFirst({
        where: {
          questions_MasterId: question.id,
        },
      });

      if (existingAddon) {
        // อัปเดตข้อมูลที่มีอยู่
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
        // สร้างข้อมูลใหม่
        await prisma.questions_PHQA_Addon.create({
          data: {
            questions_MasterId: question.id,
            q1: question.addon[0].q1,
            q2: question.addon[0].q2,
          },
        });
      }
    }

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
  if (
    value.status == 1 &&
    value.schedule_telemed != null &&
    value.consult != null
  ) {
    return 2;
  } else if (
    (value.status == 1 || value.status == 2) &&
    value.consult != null &&
    value.subjective &&
    value.objective &&
    value.assessment &&
    value.plan
  ) {
    return 3;
  } else {
    return value.status;
  }
}

function SumValue(value: any) {
  const cal = [];

  for (const key in value) {
    if (key.startsWith("q")) {
      const val = Number(`${(value as any)[key]}`);

      cal.push(val);
    }
  }

  const PHQA_SUM = cal.reduce((prev, cur) => {
    return prev + cur;
  }, 0);

  return PHQA_SUM;
}

// เพิ่มฟังก์ชันสำหรับตรวจสอบความถูกต้องของข้อมูล
function validateQuestionData(data: any) {
  if (!data.profileId || !data.phqa || !data.Q2 || !data.phqaAddon) {
    throw new Error("ข้อมูลไม่ครบถ้วน");
  }

  // ตรวจสอบค่า PHQA ต้องอยู่ระหว่าง 0-3
  for (let i = 1; i <= 9; i++) {
    const value = data.phqa[`q${i}`];

    if (value < 0 || value > 3) {
      throw new Error(`ค่า PHQA q${i} ไม่ถูกต้อง`);
    }
  }

  // ตรวจสอบค่า 2q ต้องเป็น 0 หรือ 1
  if (data.Q2.q1 !== 0 && data.Q2.q1 !== 1) {
    throw new Error("ค่า 2Q q1 ไม่ถูกต้อง");
  }
  if (data.Q2.q2 !== 0 && data.Q2.q2 !== 1) {
    throw new Error("ค่า 2Q q2 ไม่ถูกต้อง");
  }

  // ตรวจสอบค่า PHQA Addon ต้องเป็น 0 หรือ 1
  if (data.phqaAddon.q1 !== 0 && data.phqaAddon.q1 !== 1) {
    throw new Error("ค่า PHQA Addon q1 ไม่ถูกต้อง");
  }
  if (data.phqaAddon.q2 !== 0 && data.phqaAddon.q2 !== 1) {
    throw new Error("ค่า PHQA Addon q2 ไม่ถูกต้อง");
  }
}

// แยกฟังก์ชันคำนวณผลลัพธ์
function calculateResult(phqa_sum: number, phqa_data: Questions_PHQA) {
  let result = "";
  let result_text = "";

  if (phqa_sum > 14) {
    if (phqa_sum >= 15 && phqa_sum <= 19) {
      result = "Orange";
      result_text = "พบความเสี่ยงมาก";
    } else if (phqa_sum >= 20 && phqa_sum <= 27) {
      result = "Red";
      result_text = "พบความเสี่ยงรุนแรง";
    }
  } else if (phqa_sum > 9) {
    result = "Yellow";
    result_text = "พบความเสี่ยงปานกลาง";
  } else {
    if (phqa_data.q9 > 0) {
      result = "Red";
      result_text = "พบความเสี่ยงในการฆ่าตัวตาย";
    } else {
      if (phqa_sum >= 0 && phqa_sum <= 4) {
        result = "Green";
        result_text = "ไม่พบความเสี่ยง";
      } else if (phqa_sum >= 5 && phqa_sum <= 9) {
        result = "Green";
        result_text = "พบความเสี่ยงเล็กน้อย";
      }
    }
  }

  return { result, result_text };
}
