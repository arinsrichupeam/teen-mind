import {
  getAgeAtAssessment,
  MAIN_ASSESSMENT_AGE_CUTOFF,
} from "@/lib/assessment-scale";
import { prisma } from "@/utils/prisma";

export type ReportAgeRange = "all" | "under18" | "18plus";

export function normalizeReportAgeRange(
  value: string | null | undefined
): ReportAgeRange {
  if (value === "under18" || value === "18plus") {
    return value;
  }

  return "all";
}

export function getProfileAgeForReport(
  birthday: Date | null,
  screeningDate: Date | null | undefined,
  latestAssessmentCreatedAt: Date | null | undefined
): number | null {
  if (!birthday || !latestAssessmentCreatedAt) {
    return null;
  }

  return getAgeAtAssessment(
    birthday,
    screeningDate ?? null,
    latestAssessmentCreatedAt
  );
}

export function matchesReportAgeRange(
  age: number | null,
  ageRange: ReportAgeRange
): boolean {
  if (ageRange === "all") {
    return true;
  }

  if (age === null) {
    return false;
  }

  if (ageRange === "under18") {
    return age < MAIN_ASSESSMENT_AGE_CUTOFF;
  }

  return age >= MAIN_ASSESSMENT_AGE_CUTOFF;
}

export async function filterProfileIdsByAgeRange(
  profileIds: string[],
  ageRange: ReportAgeRange
): Promise<string[]> {
  if (ageRange === "all" || profileIds.length === 0) {
    return profileIds;
  }

  const [profiles, latestByProfile] = await Promise.all([
    prisma.profile.findMany({
      where: { id: { in: profileIds } },
      select: {
        id: true,
        birthday: true,
        school: { select: { screeningDate: true } },
      },
    }),
    prisma.questions_Master.groupBy({
      by: ["profileId"],
      where: { profileId: { in: profileIds } },
      _max: { createdAt: true },
    }),
  ]);

  const latestDateMap = new Map(
    latestByProfile.map((group) => [group.profileId, group._max.createdAt])
  );

  return profiles
    .filter((profile) => {
      const age = getProfileAgeForReport(
        profile.birthday,
        profile.school?.screeningDate ?? null,
        latestDateMap.get(profile.id) ?? null
      );

      return matchesReportAgeRange(age, ageRange);
    })
    .map((profile) => profile.id);
}
