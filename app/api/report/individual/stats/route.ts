import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/get-session";
import {
  filterProfileIdsByAgeRange,
  normalizeReportAgeRange,
} from "@/lib/report-age-range";
import { prisma } from "@/utils/prisma";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();

  if (!admin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const search = url.searchParams.get("search")?.trim() || "";
  const schoolsParam = url.searchParams.get("schools")?.trim() || "";
  const schools = schoolsParam
    ? schoolsParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const ageRange = normalizeReportAgeRange(
    url.searchParams.get("ageRange")?.trim()
  );

  const profileWhere: Record<string, unknown> = {};

  if (search) {
    profileWhere.OR = [
      { firstname: { contains: search } },
      { lastname: { contains: search } },
    ];
  }
  if (schools.length > 0) {
    profileWhere.school = { name: { in: schools } };
  }

  profileWhere.questions = { some: {} };

  const matchingProfiles = await prisma.profile.findMany({
    where: profileWhere,
    select: { id: true },
  });
  const matchingProfileIds = await filterProfileIdsByAgeRange(
    matchingProfiles.map((p) => p.id),
    ageRange
  );

  if (matchingProfileIds.length === 0) {
    return NextResponse.json({ total: 0, repeatedCount: 0 });
  }

  const assessments = await prisma.questions_Master.findMany({
    where: {
      profileId: { in: matchingProfileIds },
    },
    select: { profileId: true, createdAt: true },
  });

  // Group unique Thai Buddhist years per profile
  const yearsByProfile = new Map<string, Set<number>>();

  for (const a of assessments) {
    const local = new Date(a.createdAt.getTime() + 7 * 60 * 60 * 1000);
    const thaiYear = local.getUTCFullYear() + 543;

    if (!yearsByProfile.has(a.profileId))
      yearsByProfile.set(a.profileId, new Set());
    yearsByProfile.get(a.profileId)!.add(thaiYear);
  }

  const allYears = Array.from(
    new Set(Array.from(yearsByProfile.values()).flatMap((s) => Array.from(s)))
  ).sort((a, b) => a - b);

  const total = yearsByProfile.size;
  const repeatedCount = Array.from(yearsByProfile.values()).filter(
    (s) => s.size > 1
  ).length;

  return NextResponse.json({ total, repeatedCount, years: allYears });
}
