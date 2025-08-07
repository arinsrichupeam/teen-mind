import { prisma } from "@/utils/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { selectedIds, newStatus } = body;

    if (
      !selectedIds ||
      !Array.isArray(selectedIds) ||
      selectedIds.length === 0
    ) {
      return Response.json(
        {
          success: false,
          error: "ไม่พบรายการที่เลือก",
        },
        { status: 400 }
      );
    }

    if (newStatus === undefined || newStatus === null) {
      return Response.json(
        {
          success: false,
          error: "ไม่พบสถานะใหม่",
        },
        { status: 400 }
      );
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // อัปเดตสถานะสำหรับแต่ละรายการที่เลือก
    for (const id of selectedIds) {
      try {
        await prisma.questions_Master.update({
          where: {
            id: id,
          },
          data: {
            status: parseInt(newStatus),
          },
        });

        successCount++;
      } catch (error) {
        errorCount++;
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        errors.push(
          `Error updating status for question ${id}: ${errorMessage}`
        );
      }
    }

    const response = {
      success: true,
      message: `อัปเดตสถานะสำเร็จ: ${successCount} รายการ, ผิดพลาด: ${errorCount} รายการ`,
      summary: {
        total: selectedIds.length,
        success: successCount,
        error: errorCount,
      },
      errors: errors.length > 0 ? errors : undefined,
    };

    return Response.json(response);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการอัปเดตสถานะ";

    return Response.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
