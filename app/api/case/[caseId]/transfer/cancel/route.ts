import {
  assertCanCancelTransfer,
  buildCancelTransferUpdate,
} from "@/lib/case-workflow";
import { requireCaseOperator } from "@/lib/get-session";
import { prisma } from "@/utils/prisma";

/** POST /api/case/[caseId]/transfer/cancel — source withdraws pending transfer. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const auth = await requireCaseOperator();

  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { caseId } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    responseNote?: string;
  };
  const responseNote = body.responseNote?.trim() || "";

  if (!responseNote) {
    return Response.json(
      { error: "กรุณาระบุเหตุผลการยกเลิกการส่งต่อ" },
      { status: 400 }
    );
  }

  const caseRow = await prisma.case.findUnique({
    where: { id: caseId },
    select: {
      id: true,
      status: true,
      healthcareFacilityId: true,
      transferToFacilityId: true,
    },
  });

  if (!caseRow) {
    return Response.json({ error: "ไม่พบเคส" }, { status: 404 });
  }

  const cancellerFacilityId = auth.adminProfile.healthcareFacilityId;

  if (!cancellerFacilityId) {
    return Response.json(
      { error: "บัญชีนี้ไม่มีหน่วยงานสำหรับยกเลิกส่งต่อ" },
      { status: 403 }
    );
  }

  try {
    assertCanCancelTransfer({
      status: caseRow.status,
      healthcareFacilityId: caseRow.healthcareFacilityId,
      transferToFacilityId: caseRow.transferToFacilityId,
      cancellerFacilityId,
    });

    if (
      !auth.capabilities.canViewCrossFacilityCases &&
      caseRow.healthcareFacilityId !== cancellerFacilityId
    ) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const toFacilityId = caseRow.transferToFacilityId!;
    const respondedAt = new Date();

    const updated = await prisma.$transaction(async (tx) => {
      const pending = await tx.caseTransfer.findFirst({
        where: { caseId, status: "PENDING", toFacilityId },
        orderBy: { requestedAt: "desc" },
      });

      if (pending) {
        await tx.caseTransfer.update({
          where: { id: pending.id },
          data: {
            status: "CANCELLED",
            responseNote,
            respondedAt,
          },
        });
      }

      return tx.case.update({
        where: { id: caseId },
        data: buildCancelTransferUpdate(),
      });
    });

    return Response.json({ success: true, data: updated });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "ยกเลิกการส่งต่อไม่สำเร็จ",
      },
      { status: 400 }
    );
  }
}
