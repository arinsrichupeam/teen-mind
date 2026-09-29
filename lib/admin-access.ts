import { AdminStatus } from "@prisma/client";

import { mapAdminStatusToLegacyNumber } from "@/lib/legacy-value-mapping";

/**
 * Admin app + admin APIs are only for APPROVED ProfileAdmin.
 * Accepts enum, string enum, or legacy UI number (1 = approved).
 */
export function isApprovedAdminStatus(
  status: AdminStatus | string | number | null | undefined
): boolean {
  return mapAdminStatusToLegacyNumber(status) === 1;
}
