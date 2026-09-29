import { AdminStatus, Sex, ScreeningResult } from "@prisma/client";

/** Legacy UI/DB risk color strings stored on questions_master.result */
export type LegacyRiskColor =
  | "Green"
  | "Green-Low"
  | "Yellow"
  | "Orange"
  | "Red";

/**
 * Map legacy risk color → ScreeningResult (ADR 0002).
 * Empty / unknown → INCOMPLETE.
 */
export function mapLegacyRiskColorToScreeningResult(
  color: string | null | undefined
): ScreeningResult {
  if (color == null || String(color).trim() === "") {
    return ScreeningResult.INCOMPLETE;
  }

  switch (String(color).trim()) {
    case "Green":
      return ScreeningResult.NEGATIVE;
    case "Green-Low":
      return ScreeningResult.POSITIVE_LOW;
    case "Yellow":
      return ScreeningResult.POSITIVE_MODERATE;
    case "Orange":
      return ScreeningResult.POSITIVE_HIGH;
    case "Red":
      return ScreeningResult.POSITIVE_SEVERE;
    default:
      return ScreeningResult.INCOMPLETE;
  }
}

/** Map ScreeningResult → legacy color string for UI display. */
export function mapScreeningResultToLegacyColor(
  result: ScreeningResult | string | null | undefined
): LegacyRiskColor | "" {
  switch (result) {
    case ScreeningResult.NEGATIVE:
    case "NEGATIVE":
      return "Green";
    case ScreeningResult.POSITIVE_LOW:
    case "POSITIVE_LOW":
      return "Green-Low";
    case ScreeningResult.POSITIVE_MODERATE:
    case "POSITIVE_MODERATE":
      return "Yellow";
    case ScreeningResult.POSITIVE_HIGH:
    case "POSITIVE_HIGH":
      return "Orange";
    case ScreeningResult.POSITIVE_SEVERE:
    case "POSITIVE_SEVERE":
      return "Red";
    default:
      return "";
  }
}

/**
 * Map legacy Profile.sex Int → Sex enum.
 * 1 → MALE, 2 → FEMALE, else/null → UNSPECIFIED.
 */
export function mapLegacySexToSex(
  sex: number | string | null | undefined
): Sex {
  if (sex == null || sex === "") {
    return Sex.UNSPECIFIED;
  }

  if (sex === Sex.MALE || sex === "MALE") return Sex.MALE;
  if (sex === Sex.FEMALE || sex === "FEMALE") return Sex.FEMALE;
  if (sex === Sex.UNSPECIFIED || sex === "UNSPECIFIED") return Sex.UNSPECIFIED;

  const n = typeof sex === "number" ? sex : Number(sex);

  if (n === 1) return Sex.MALE;
  if (n === 2) return Sex.FEMALE;

  return Sex.UNSPECIFIED;
}

/** Map Sex enum → legacy UI number (1=male, 2=female, 3=unspecified). */
export function mapSexToLegacyNumber(
  sex: Sex | string | number | null | undefined
): number {
  if (sex === Sex.MALE || sex === "MALE" || sex === 1) return 1;
  if (sex === Sex.FEMALE || sex === "FEMALE" || sex === 2) return 2;

  return 3;
}

/**
 * Map legacy admin status Int → AdminStatus enum.
 * 0 → PENDING, 1 → APPROVED, 3 → DISABLED.
 */
export function mapLegacyAdminStatus(
  status: number | string | null | undefined
): AdminStatus {
  if (status === AdminStatus.PENDING || status === "PENDING") {
    return AdminStatus.PENDING;
  }
  if (status === AdminStatus.APPROVED || status === "APPROVED") {
    return AdminStatus.APPROVED;
  }
  if (status === AdminStatus.DISABLED || status === "DISABLED") {
    return AdminStatus.DISABLED;
  }

  const n = typeof status === "number" ? status : Number(status);

  if (n === 1) return AdminStatus.APPROVED;
  if (n === 3) return AdminStatus.DISABLED;

  return AdminStatus.PENDING;
}

/** Map AdminStatus → legacy UI number. */
export function mapAdminStatusToLegacyNumber(
  status: AdminStatus | string | number | null | undefined
): number {
  if (
    status === AdminStatus.APPROVED ||
    status === "APPROVED" ||
    status === 1
  ) {
    return 1;
  }
  if (
    status === AdminStatus.DISABLED ||
    status === "DISABLED" ||
    status === 3
  ) {
    return 3;
  }
  if (status === 2) {
    // legacy "ไม่ใช้งาน" bucket used by some UIs
    return 3;
  }

  return 0;
}

/** Cast/map string[] filter values (legacy colors or enum names) → ScreeningResult[]. */
export function mapFilterResultsToScreeningResults(
  results: string[] | null | undefined
): ScreeningResult[] {
  if (!results?.length) return [];

  return results.map((r) => {
    if (Object.values(ScreeningResult).includes(r as ScreeningResult)) {
      return r as ScreeningResult;
    }

    return mapLegacyRiskColorToScreeningResult(r);
  });
}
