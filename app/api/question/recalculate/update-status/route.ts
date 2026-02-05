import { requireAdmin } from "@/lib/get-session";
import { prisma } from "@/utils/prisma";

// ฟังก์ชันคำนวณสถานะตามเงื่อนไข
function calculateStatus(question: any) {
  // ตรวจสอบ HN ว่าง
  if (!question.profile?.hn) {
    return 0; // รอระบุ HN
  }

  // ตรวจสอบ schedule_telemed และ Consultant ว่าง
  if (!question.schedule_telemed || !question.consult) {
    return 1; // รอจัดนัด Telemed
  }

  // ตรวจสอบ SOAP ว่าง
  if (
    !question.subjective ||
    !question.objective ||
    !question.assessment ||
    !question.plan
  ) {
    return 2; // รอสรุปผลการให้คำปรึกษา
  }

  return 3; // เสร็จสิ้น
}

export async function POST() {
  const auth = await requireAdmin();

  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

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
        // คำนวณสถานะใหม่
        const newStatus = calculateStatus(question);

        // อัปเดตเฉพาะสถานะในฐานข้อมูล
        await prisma.questions_Master.update({
          where: {
            id: question.id,
          },
          data: {
            status: newStatus,
          },
        });

        successCount++;
      } catch (error) {
        errorCount++;
        errors.push(
          `Error updating status for question ${question.id}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    return Response.json({
      success: true,
      message: `อัปเดตสถานะสำเร็จ: ${successCount} รายการ, ผิดพลาด: ${errorCount} รายการ`,
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
            : "เกิดข้อผิดพลาดในการอัปเดตสถานะ",
      },
      { status: 500 }
    );
  }
}
