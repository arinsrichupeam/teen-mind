import { ScreeningResult } from "@prisma/client";

import { mapLegacyRiskColorToScreeningResult } from "@/lib/legacy-value-mapping";
import {
  mapLegacyFollowUpStatusToCaseStatus,
  OPEN_CASE_STATUSES,
} from "@/lib/case-status-mapping";
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

    const nextStatus =
      typeof newStatus === "number" || /^\d+$/.test(String(newStatus))
        ? mapLegacyFollowUpStatusToCaseStatus(Number(newStatus))
        : mapLegacyFollowUpStatusToCaseStatus(
            // allow enum string pass-through via closed=3
            String(newStatus) === "CLOSED"
              ? 3
              : String(newStatus) === "IN_PROGRESS"
                ? 2
                : 1
          );

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
        { status: { in: OPEN_CASE_STATUSES } },
        {
          OR: [
            {
              AND: [
                { questions9Q: { some: {} } },
                {
                  result: resultParam
                    ? mapLegacyRiskColorToScreeningResult(resultParam)
                    : ScreeningResult.NEGATIVE,
                },
              ],
            },
            {
              AND: [
                { NOT: { questions9Q: { some: {} } } },
                {
                  result: {
                    in: resultParam
                      ? resultParam
                          .split(",")
                          .map((r: string) => r.trim())
                          .map((r: string) =>
                            mapLegacyRiskColorToScreeningResult(r)
                          )
                      : [
                          ScreeningResult.NEGATIVE,
                          ScreeningResult.POSITIVE_LOW,
                        ],
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
        whereConditions.push({
          questions2Q: { some: { OR: [{ q1: 1 }, { q2: 1 }] } },
        });
      } else if (q2Risk === "no-risk") {
        whereConditions.push({
          NOT: { questions2Q: { some: { OR: [{ q1: 1 }, { q2: 1 }] } } },
        });
      }

      if (q8Risk === "risk") {
        whereConditions.push({ questions8Q: { some: { sum: { gt: 0 } } } });
      } else if (q8Risk === "no-risk") {
        whereConditions.push({
          NOT: { questions8Q: { some: { sum: { gt: 0 } } } },
        });
      }

      const updateResult = await prisma.case.updateMany({
        where: { AND: whereConditions },
        data: { status: nextStatus },
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
        await prisma.case.update({
          where: { id: id },
          data: { status: nextStatus },
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
