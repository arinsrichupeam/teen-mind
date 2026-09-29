import { assertCanClose, buildCloseUpdate } from "@/lib/case-workflow";
import { requireCaseOperator } from "@/lib/get-session";
import { prisma } from "@/utils/prisma";

/** POST /api/case/[caseId]/close */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const auth = await requireCaseOperator();

  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { caseId } = await params;
  const body = (await req.json().catch(() => ({}))) as { reason?: string };
  const reason = (body.reason ?? "").trim();

  if (!reason) {
    return Response.json(
      { error: "close reason is required" },
      { status: 400 }
    );
  }

  const caseRow = await prisma.case.findUnique({
    where: { id: caseId },
    select: {
      id: true,
      status: true,
      healthcareFacilityId: true,
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
    assertCanClose(caseRow.status);

    const updated = await prisma.case.update({
      where: { id: caseId },
      data: buildCloseUpdate(reason),
    });

    return Response.json({ success: true, data: updated });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "ปิดเคสไม่สำเร็จ",
      },
      { status: 400 }
    );
  }
}
