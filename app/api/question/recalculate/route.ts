import { Questions_PHQA } from "@prisma/client";

import { prisma } from "@/utils/prisma";

// ฟังก์ชันคำนวณผลลัพธ์ PHQA
function calculateResult(phqa_sum: number) {
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
    if (phqa_sum >= 0 && phqa_sum <= 4) {
      result = "Green";
      result_text = "ไม่พบความเสี่ยง";
    } else if (phqa_sum >= 5 && phqa_sum <= 9) {
      result = "Green-Low";
      result_text = "พบความเสี่ยงเล็กน้อย";
    }
  }

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

    // ประมวลผลแต่ละรายการ
    for (const question of allQuestions) {
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
            // อัปเดต result และ result_text ใน Questions_Master
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
      message: `Re-calculate completed. Success: ${successCount}, Errors: ${errorCount}`,
      summary: {
        total: allQuestions.length,
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
            : "เกิดข้อผิดพลาดในการ re-calculate",
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

    return Response.json({
      success: true,
      data: {
        totalQuestions,
        resultStats: resultStats.map((stat) => ({
          result: stat.result,
          count: stat._count.result,
        })),
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
