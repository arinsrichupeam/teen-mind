import { requireAdmin } from "@/lib/get-session";
import { prisma } from "@/utils/prisma";

export async function POST(req: Request) {
  const auth = await requireAdmin();

  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { newStatus, useFilter, filter, selectedIds } = body;

    if (newStatus === undefined || newStatus === null) {
      return Response.json(
        { success: false, error: "ไม่พบสถานะใหม่" },
        { status: 400 }
      );
    }

    if (useFilter) {
      if (!filter || typeof filter !== "object") {
        return Response.json(
          { success: false, error: "ไม่พบข้อมูลตัวกรอง" },
          { status: 400 }
        );
      }

      const {
        school = "",
        result: resultParam = "",
        q2Risk = "",
        q8Risk = "",
      } = filter as {
        school: string;
        result: string;
        q2Risk: string;
        q8Risk: string;
      };

      const whereConditions: Record<string, unknown>[] = [
        { status: { in: [0, 1, 2] } },
        {
          OR: [
            {
              AND: [
                { q9: { some: {} } },
                { result: resultParam ? resultParam : "Green" },
              ],
            },
            {
              AND: [
                { NOT: { q9: { some: {} } } },
                {
                  result: {
                    in: resultParam
                      ? resultParam.split(",").map((r: string) => r.trim())
                      : ["Green", "Green-Low"],
                  },
                },
              ],
            },
          ],
        },
      ];

      if (school) {
        whereConditions.push({ profile: { school: { name: school } } });
      }

      if (q2Risk === "risk") {
        whereConditions.push({ q2: { some: { OR: [{ q1: 1 }, { q2: 1 }] } } });
      } else if (q2Risk === "no-risk") {
        whereConditions.push({
          NOT: { q2: { some: { OR: [{ q1: 1 }, { q2: 1 }] } } },
        });
      }

      if (q8Risk === "risk") {
        whereConditions.push({ q8: { some: { sum: { gt: 0 } } } });
      } else if (q8Risk === "no-risk") {
        whereConditions.push({ NOT: { q8: { some: { sum: { gt: 0 } } } } });
      }

      const updateResult = await prisma.questions_Master.updateMany({
        where: { AND: whereConditions },
        data: { status: newStatus },
      });

      return Response.json({
        success: true,
        message: `อัปเดตสถานะสำเร็จ: ${updateResult.count} รายการ`,
        summary: {
          total: updateResult.count,
          success: updateResult.count,
          error: 0,
        },
      });
    }

    if (
      !selectedIds ||
      !Array.isArray(selectedIds) ||
      selectedIds.length === 0
    ) {
      return Response.json(
        { success: false, error: "ไม่พบรายการที่เลือก" },
        { status: 400 }
      );
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const id of selectedIds) {
      try {
        await prisma.questions_Master.update({
          where: { id: id },
          data: { status: newStatus },
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

    return Response.json({
      success: true,
      message: `อัปเดตสถานะสำเร็จ: ${successCount} รายการ, ผิดพลาด: ${errorCount} รายการ`,
      summary: {
        total: selectedIds.length,
        success: successCount,
        error: errorCount,
      },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการอัปเดตสถานะ";

    return Response.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
