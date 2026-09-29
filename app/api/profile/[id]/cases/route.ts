import { CaseStatus, type Prisma } from "@prisma/client";

import { buildCaseVisibilityWhere } from "@/lib/admin-data-scope";
import { requireAdmin } from "@/lib/get-session";
import { toProfileCaseHistorySummary } from "@/lib/profile-case-history";
import { prisma } from "@/utils/prisma";

const historyInclude = {
  healthcareFacility: { select: { id: true, name: true } },
  treatmentNotes: {
    select: {
      round: true,
      consult: true,
      scheduleTelemed: true,
      unreachable: true,
      subjective: true,
      objective: true,
      assessment: true,
      plan: true,
      note: true,
      followUp: true,
    },
  },
  questions2Q: { select: { round: true } },
  questions9Q: { select: { round: true } },
  questionsPhqa: { select: { round: true } },
  questions8Q: { select: { round: true } },
  questionsPhqaAddon: { select: { round: true } },
  questionsProblem: { select: { round: true } },
} satisfies Prisma.CaseInclude;

/**
 * GET /api/profile/[id]/cases
 * Prior CLOSED cases for the same Profile (excludes current case), scoped to admin visibility.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();

  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: profileId } = await params;

  if (!profileId?.trim()) {
    return Response.json({ error: "Missing profile id" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const excludeCaseId = searchParams.get("excludeCaseId")?.trim() || null;
  const statusParam = searchParams.get("status")?.trim() || CaseStatus.CLOSED;

  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    select: { id: true },
  });

  if (!profile) {
    return Response.json({ error: "ไม่พบโปรไฟล์" }, { status: 404 });
  }

  const scopeWhere = buildCaseVisibilityWhere(auth.dataScope);
  const statusFilter = Object.values(CaseStatus).includes(
    statusParam as CaseStatus
  )
    ? (statusParam as CaseStatus)
    : CaseStatus.CLOSED;

  const where: Prisma.CaseWhereInput = {
    profileId,
    status: statusFilter,
  };

  if (excludeCaseId) {
    where.id = { not: excludeCaseId };
  }

  const scopedWhere: Prisma.CaseWhereInput = scopeWhere
    ? { AND: [where, scopeWhere] }
    : where;

  const rows = await prisma.case.findMany({
    where: scopedWhere,
    include: historyInclude,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return Response.json({
    data: rows.map((row) => toProfileCaseHistorySummary(row)),
  });
}
