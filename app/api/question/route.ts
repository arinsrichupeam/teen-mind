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
    const location_data: LocationData = data.location;

    const phqa_sum = SumValue(phqa_data);
    const { result, result_text } = calculateResult(
      phqa_sum,
      phqa_data,
      Q2_data
    );

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
  const data = await req.json();

  const question: QuestionsData = data;

  try {
    // await prisma.questions_Master.update({
    //   where: {
    //     id: question.id,
    //   },
    //   data: {
    //     consult: question.consult,
    //     schedule_telemed: question.schedule_telemed,
    //     subjective: question.subjective,
    //     objective: question.objective,
    //     assessment: question.assessment,
    //     plan: question.plan,
    //     follow_up: question.follow_up,
    //     status: CalStatus(question),
    //   },
    // });

    // return Response.json("Success");

    console.log(CalStatus(question));
  }
  catch (err) {
    console.log(err);
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
    value.status == 2 &&
    value.subjective &&
    // != "" && value.subj
    // ective != null
    value.objective &&
    // != "" && value.objective != null
    value.assessment &&
    // != "" && value.assessment != null
    value.plan
    // != "" && value.plan != null
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
  if (!data.profileId || !data.phqa || !data.Q2) {
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
    throw new Error("ค่า Addon q1 ไม่ถูกต้อง");
  }
  if (data.Q2.q2 !== 0 && data.Q2.q2 !== 1) {
    throw new Error("ค่า Addon q2 ไม่ถูกต้อง");
  }
}

// แยกฟังก์ชันคำนวณผลลัพธ์
function calculateResult(
  phqa_sum: number,
  phqa_data: Questions_PHQA,
  Q2_data: Questions_PHQA_Addon
) {
  let result = "";
  let result_text = "";

  if (phqa_sum > 14) {
    result = "Red";
    if (phqa_sum >= 15 && phqa_sum <= 19) {
      result_text = "พบความเสี่ยงมาก";
    } else if (phqa_sum >= 20 && phqa_sum <= 27) {
      result_text = "พบความเสี่ยงรุนแรง";
    }
  } else if (phqa_sum > 9) {
    result = "Yellow";
    result_text = "พบความเสี่ยงปานกลาง";
  } else {
    if (phqa_data.q9 > 0 || Q2_data.q1 == 1 || Q2_data.q2 == 1) {
      result = "Red";
      result_text = "พบความเสี่ยง โปรดประเมิน 8Q";
    } else {
      result = "Green";
      if (phqa_sum >= 0 && phqa_sum <= 4) {
        result_text = "ไม่พบความเสี่ยง";
      } else if (phqa_sum >= 5 && phqa_sum <= 9) {
        result_text = "พบความเสี่ยงเล็กน้อย";
      }
    }
  }

  return { result, result_text };
}
