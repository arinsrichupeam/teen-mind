/**
 * Claim a PENDING case for the current operator.
 * Returns true if claimed or already not PENDING; false on failure.
 */
export async function claimCaseIfPending(
  caseId: string,
  caseStatus: string | undefined | null
): Promise<{ ok: boolean; claimed: boolean; error?: string }> {
  if (caseStatus !== "PENDING") {
    return { ok: true, claimed: false };
  }

  try {
    const res = await fetch(`/api/case/${caseId}/claim`, { method: "POST" });
    const json = await res.json().catch(() => ({}));

    if (!res.ok || json.success === false) {
      return {
        ok: false,
        claimed: false,
        error: typeof json.error === "string" ? json.error : "รับเคสไม่สำเร็จ",
      };
    }

    return { ok: true, claimed: true };
  } catch (err) {
    return {
      ok: false,
      claimed: false,
      error: err instanceof Error ? err.message : "รับเคสไม่สำเร็จ",
    };
  }
}
