import { CaseStatus, type Prisma } from "@prisma/client";

import { buildCaseVisibilityWhere } from "@/lib/admin-data-scope";
import { buildTransferPendingQueueWhere } from "@/lib/case-workflow";
import { requireCaseOperator } from "@/lib/get-session";
import { prisma } from "@/utils/prisma";

const listInclude = {
  profile: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      birthDate: true,
      hn: true,
      prefix: { select: { id: true, name: true } },
      school: { select: { id: true, name: true } },
    },
  },
  healthcareFacility: { select: { id: true, name: true } },
  transferToFacility: { select: { id: true, name: true } },
  assigneeAdmin: {
    select: { id: true, firstName: true, lastName: true },
  },
} satisfies Prisma.CaseInclude;

/** GET /api/case — facility-scoped Case queue (Consult/Admin). */
export async function GET(req: Request) {
  const auth = await requireCaseOperator();

  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10) || 20)
  );
  const statusParam = searchParams.get("status");
  const assigneeAdminId = searchParams.get("assigneeAdminId");
  const transferInbox = searchParams.get("transferInbox") === "1";
  const requestedFacilityId = searchParams.get("healthcareFacilityId");
  const scopeWhere = buildCaseVisibilityWhere(auth.dataScope);

  const where: Prisma.CaseWhereInput = {};

  if (transferInbox) {
    const homeFacilityId = auth.adminProfile.healthcareFacilityId;
    const transferFacilityId = requestedFacilityId ?? homeFacilityId;

    Object.assign(where, buildTransferPendingQueueWhere(transferFacilityId));
    if (!transferFacilityId && scopeWhere) {
      Object.assign(where, scopeWhere);
    }
  } else {
    if (requestedFacilityId && !scopeWhere) {
      where.healthcareFacilityId = requestedFacilityId;
    } else if (requestedFacilityId && scopeWhere) {
      where.AND = [scopeWhere, { healthcareFacilityId: requestedFacilityId }];
    } else if (scopeWhere) {
      Object.assign(where, scopeWhere);
    }
    if (statusParam) {
      const statuses = statusParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .filter((s) => s !== CaseStatus.TRANSFER_PENDING) as CaseStatus[];

      if (statuses.length === 1) where.status = statuses[0];
      else if (statuses.length > 1) where.status = { in: statuses };
      else where.status = { not: CaseStatus.TRANSFER_PENDING };
    } else {
      where.status = { not: CaseStatus.TRANSFER_PENDING };
    }
    if (assigneeAdminId) {
      where.assigneeAdminId =
        assigneeAdminId === "me" ? auth.adminProfile.id : assigneeAdminId;
    }
  }

  const [total, rows] = await Promise.all([
    prisma.case.count({ where }),
    prisma.case.findMany({
      where,
      include: listInclude,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return Response.json({
    data: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  });
}
