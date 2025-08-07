import { Questions_PHQA } from "@prisma/client";

import { getPhqaRiskLevel, getPhqaRiskText } from "@/utils/helper";
import { prisma } from "@/utils/prisma";

// ฟังก์ชันคำนวณผลลัพธ์ PHQA
function calculateResult(phqa_sum: number) {
  const result = getPhqaRiskLevel(phqa_sum);
  const result_text = getPhqaRiskText(phqa_sum);

  return { result, result_text };
}

// ฟังก์ชันคำนวณ sum ของ PHQA
function calculateSum(phqa_data: Questions_PHQA) {
  return (
    phqa_data.q1 +
    phqa_data.q2 +
    phqa_data.q3 +
    phqa_data.q4 +
    phqa_data.q5 +
    phqa_data.q6 +
    phqa_data.q7 +
    phqa_data.q8 +
    phqa_data.q9
  );
}

export async function POST() {
  try {
    // ดึงข้อมูลทั้งหมดที่มี PHQA
    const allQuestions = await prisma.questions_Master.findMany({
      include: {
        phqa: true,
        profile: true,
      },
      where: {
        phqa: {
          some: {},
        },
      },
    });

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    const totalQuestions = allQuestions.length;

    // ประมวลผลแต่ละรายการ
    for (let i = 0; i < allQuestions.length; i++) {
      const question = allQuestions[i];

      try {
        if (question.phqa && question.phqa.length > 0) {
          const phqaData = question.phqa[0];

          // คำนวณ sum ใหม่
          const newSum = calculateSum(phqaData);

          // คำนวณผลลัพธ์ใหม่
          const { result, result_text } = calculateResult(newSum);

          // อัปเดตข้อมูลในฐานข้อมูล
          await prisma.$transaction([
            // อัปเดต sum ใน PHQA
            prisma.questions_PHQA.updateMany({
              where: {
                questions_MasterId: question.id,
              },
              data: {
                sum: newSum,
              },
            }),
            // อัปเดต result และ result_text ใน Questions_Master (ไม่รวม status)
            prisma.questions_Master.update({
              where: {
                id: question.id,
              },
              data: {
                result: result,
                result_text: result_text,
              },
            }),
          ]);

          successCount++;
        }
      } catch (error) {
        errorCount++;
        errors.push(
          `Error processing question ${question.id}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    return Response.json({
      success: true,
      message: `คำนวณคะแนน PHQA ใหม่เสร็จสิ้น สำเร็จ: ${successCount}, ผิดพลาด: ${errorCount}`,
      summary: {
        total: totalQuestions,
        success: successCount,
        error: errorCount,
      },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "เกิดข้อผิดพลาดในการคำนวณคะแนน PHQA ใหม่",
      },
      { status: 500 }
    );
  }
}

// GET endpoint สำหรับดูสถิติ
export async function GET() {
  try {
    const totalQuestions = await prisma.questions_Master.count({
      where: {
        phqa: {
          some: {},
        },
      },
    });

    const resultStats = await prisma.questions_Master.groupBy({
      by: ["result"],
      where: {
        phqa: {
          some: {},
        },
      },
      _count: {
        result: true,
      },
    });

    // ดึงข้อมูลสถานะ re-calculate
    const statusStats = await prisma.questions_Master.groupBy({
      by: ["status"],
      where: {
        phqa: {
          some: {},
        },
      },
      _count: {
        status: true,
      },
    });

    // ดึงข้อมูลรายการที่มี hn ว่าง
    const emptyHnCount = await prisma.questions_Master.count({
      where: {
        phqa: {
          some: {},
        },
        profile: {
          hn: null,
        },
      },
    });

    // ดึงข้อมูลรายการที่มี hn ไม่ว่าง
    const filledHnCount = await prisma.questions_Master.count({
      where: {
        phqa: {
          some: {},
        },
        profile: {
          hn: {
            not: null,
          },
        },
      },
    });

    return Response.json({
      success: true,
      data: {
        totalQuestions,
        resultStats: resultStats.map((stat) => ({
          result: stat.result,
          count: stat._count.result,
        })),
        statusStats: statusStats.map((stat) => ({
          status: stat.status,
          count: stat._count.status,
        })),
        hnStats: {
          empty: emptyHnCount,
          filled: filledHnCount,
        },
      },
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "เกิดข้อผิดพลาดในการดึงข้อมูลสถิติ",
      },
      { status: 500 }
    );
  }
}
