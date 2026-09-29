/**
 * Extract admin register payload from request body.
 * Client historically sends `{ profile_admin: ... }`; accept aliases too.
 */
export function extractAdminRegisterPayload(
  data: Record<string, unknown> | null | undefined
): Record<string, unknown> | null {
  if (!data || typeof data !== "object") return null;

  const candidate =
    data.profile_admin ?? data.profileAdmin ?? data.profileAdmins;

  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return null;
  }

  return candidate as Record<string, unknown>;
}
