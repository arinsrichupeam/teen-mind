import type { Prisma } from "@prisma/client";

import { caseMatchesAdminScope } from "@/lib/admin-data-scope";
import { requireCaseOperator, type AdminAuth } from "@/lib/get-session";
import { prisma } from "@/utils/prisma";

const facilityScopeSelect = {
  id: true,
  name: true,
  affiliationId: true,
  zoneId: true,
} as const;

const detailInclude = {
  profile: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      birthDate: true,
      hn: true,
      phone: true,
      citizenId: true,
      prefix: { select: { id: true, name: true } },
      school: { select: { id: true, name: true } },
    },
  },
  healthcareFacility: { select: facilityScopeSelect },
  transferToFacility: { select: facilityScopeSelect },
  assigneeAdmin: {
    select: { id: true, firstName: true, lastName: true },
  },
  treatmentNotes: { orderBy: { round: "asc" as const } },
  transfers: {
    orderBy: { requestedAt: "desc" as const },
    take: 10,
    include: {
      fromFacility: { select: { id: true, name: true } },
      toFacility: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.CaseInclude;

function canAccessCase(
  caseRow: {
    healthcareFacilityId: string | null;
    transferToFacilityId: string | null;
    healthcareFacility?: {
      id: string;
      affiliationId: number;
      zoneId: number | null;
    } | null;
    transferToFacility?: {
      id: string;
      affiliationId: number;
      zoneId: number | null;
    } | null;
  },
  auth: AdminAuth
): boolean {
  return caseMatchesAdminScope(caseRow, auth.dataScope);
}

/** GET /api/case/[caseId] */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const auth = await requireCaseOperator();

  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { caseId } = await params;
  const caseRow = await prisma.case.findUnique({
    where: { id: caseId },
    include: detailInclude,
  });

  if (!caseRow) {
    return Response.json({ error: "ไม่พบเคส" }, { status: 404 });
  }

  if (!canAccessCase(caseRow, auth)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  return Response.json({ data: caseRow });
}
