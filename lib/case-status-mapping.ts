import { CaseStatus } from "@prisma/client";

/**
 * Map UI follow-up status chips (0–3) → CaseStatus for writes / coarse filters.
 * Note: true follow-up progress is derived via calculateQuestionStatus;
 * CaseStatus is the workflow column after v2.
 */
export function mapLegacyFollowUpStatusToCaseStatus(
  status: number
): CaseStatus {
  if (status === 3) return CaseStatus.CLOSED;
  if (status === 2) return CaseStatus.IN_PROGRESS;

  return CaseStatus.PENDING;
}

/** Expand one or more UI 0–3 values into CaseStatus values for `status: { in: [...] }`. */
export function mapLegacyFollowUpStatusesToCaseStatuses(
  statuses: number[]
): CaseStatus[] {
  const set = new Set<CaseStatus>();

  for (const n of statuses) {
    if (n === 0 || n === 1) set.add(CaseStatus.PENDING);
    else if (n === 2) {
      set.add(CaseStatus.IN_PROGRESS);
      set.add(CaseStatus.TRANSFER_PENDING);
    } else if (n === 3) set.add(CaseStatus.CLOSED);
  }

  return Array.from(set);
}

/**
 * Prisma where fragment for admin list status filter (0–3).
 * 0 ≈ no HN; 1 ≈ PENDING with HN; 2 ≈ in progress; 3 ≈ closed.
 */
export function buildLegacyFollowUpStatusWhere(
  statuses: number[]
): Record<string, unknown> | null {
  if (!statuses.length) return null;

  const branches: Record<string, unknown>[] = [];

  if (statuses.includes(0)) {
    branches.push({
      OR: [{ profile: { hn: null } }, { profile: { hn: "" } }],
    });
  }

  if (statuses.includes(1)) {
    branches.push({
      AND: [
        { status: CaseStatus.PENDING },
        { profile: { hn: { not: null } } },
        { NOT: { profile: { hn: "" } } },
      ],
    });
  }

  if (statuses.includes(2)) {
    branches.push({
      status: {
        in: [CaseStatus.IN_PROGRESS, CaseStatus.TRANSFER_PENDING],
      },
    });
  }

  if (statuses.includes(3)) {
    branches.push({ status: CaseStatus.CLOSED });
  }

  if (branches.length === 0) return null;
  if (branches.length === 1) return branches[0];

  return { OR: branches };
}

/** Open cases eligible for bulk status update (not closed). */
export const OPEN_CASE_STATUSES: CaseStatus[] = [
  CaseStatus.PENDING,
  CaseStatus.IN_PROGRESS,
  CaseStatus.TRANSFER_PENDING,
];
