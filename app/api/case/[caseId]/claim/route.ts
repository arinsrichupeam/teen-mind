import { assertCanClaim, buildClaimUpdate } from "@/lib/case-workflow";
import { requireCaseOperator } from "@/lib/get-session";
import { prisma } from "@/utils/prisma";

/** POST /api/case/[caseId]/claim — assign current admin to PENDING case. */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const auth = await requireCaseOperator();

  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!auth.capabilities.canClaimCase) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { caseId } = await params;
  const caseRow = await prisma.case.findUnique({
    where: { id: caseId },
    select: {
      id: true,
      status: true,
      healthcareFacilityId: true,
    },
  });

  if (!caseRow) {
    return Response.json({ error: "ไม่พบเคส" }, { status: 404 });
  }

  const homeFacilityId = auth.adminProfile.healthcareFacilityId;

  if (!homeFacilityId) {
    return Response.json(
      { error: "บัญชีนี้ไม่มีหน่วยงานสำหรับรับเคส" },
      { status: 403 }
    );
  }

  if (
    !auth.capabilities.canViewCrossFacilityCases &&
    caseRow.healthcareFacilityId &&
    caseRow.healthcareFacilityId !== homeFacilityId
  ) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    assertCanClaim(caseRow, {
      id: auth.adminProfile.id,
      healthcareFacilityId: homeFacilityId,
      status: auth.adminProfile.status,
    });

    const updated = await prisma.case.update({
      where: { id: caseId },
      data: buildClaimUpdate(caseRow, {
        id: auth.adminProfile.id,
        healthcareFacilityId: homeFacilityId,
      }),
      include: {
        assigneeAdmin: {
          select: { id: true, firstName: true, lastName: true },
        },
        healthcareFacility: { select: { id: true, name: true } },
      },
    });

    return Response.json({ success: true, data: updated });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "รับเคสไม่สำเร็จ",
      },
      { status: 400 }
    );
  }
}
