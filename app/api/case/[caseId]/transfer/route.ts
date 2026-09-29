import { FacilityStatus } from "@prisma/client";

import {
  assertCanRequestTransfer,
  buildRequestTransferUpdate,
} from "@/lib/case-workflow";
import { requireCaseOperator } from "@/lib/get-session";
import { prisma } from "@/utils/prisma";

/** POST /api/case/[caseId]/transfer — request transfer to another facility. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const auth = await requireCaseOperator();

  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { caseId } = await params;
  const body = (await req.json()) as {
    toFacilityId?: string;
    note?: string;
  };
  const toFacilityId = body.toFacilityId?.trim();
  const transferNote = body.note?.trim() || "";

  if (!toFacilityId) {
    return Response.json(
      { error: "toFacilityId is required" },
      { status: 400 }
    );
  }

  if (!transferNote) {
    return Response.json(
      { error: "กรุณาระบุหมายเหตุการส่งต่อ" },
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
      assigneeAdminId: true,
    },
  });

  if (!caseRow) {
    return Response.json({ error: "ไม่พบเคส" }, { status: 404 });
  }

  if (
    !auth.capabilities.canViewCrossFacilityCases &&
    caseRow.healthcareFacilityId !== auth.adminProfile.healthcareFacilityId
  ) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    assertCanRequestTransfer({
      status: caseRow.status,
      healthcareFacilityId: caseRow.healthcareFacilityId,
      transferToFacilityId: caseRow.transferToFacilityId,
      toFacilityId,
    });

    const facility = await prisma.healthcareFacility.findFirst({
      where: { id: toFacilityId, status: FacilityStatus.ACTIVE },
      select: { id: true },
    });

    if (!facility) {
      throw new Error("target facility not found or inactive");
    }

    const requestedAt = new Date();

    const updated = await prisma.$transaction(async (tx) => {
      await tx.caseTransfer.create({
        data: {
          caseId,
          fromFacilityId: caseRow.healthcareFacilityId,
          toFacilityId,
          status: "PENDING",
          requestNote: transferNote,
          requestedAt,
        },
      });

      return tx.case.update({
        where: { id: caseId },
        data: buildRequestTransferUpdate({
          toFacilityId,
          note: transferNote,
          requestedAt,
        }),
      });
    });

    return Response.json({ success: true, data: updated });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "ส่งต่อเคสไม่สำเร็จ",
      },
      { status: 400 }
    );
  }
}
