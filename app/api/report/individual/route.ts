import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/get-session";
import {
  filterProfileIdsByAgeRange,
  normalizeReportAgeRange,
} from "@/lib/report-age-range";
import { prisma } from "@/utils/prisma";

function toThaiDateKey(date: Date): string {
  // UTC+7
  const local = new Date(date.getTime() + 7 * 60 * 60 * 1000);

  return local.toISOString().split("T")[0];
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();

  if (!admin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const limit = Math.min(
    9999,
    Math.max(1, parseInt(url.searchParams.get("limit") || "10", 10))
  );
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
  const repeatedOnly = url.searchParams.get("repeated") === "true";
  const sortBy = url.searchParams.get("sortBy") || "date"; // "date" | "name" | "count"
  const sortDir = url.searchParams.get("sortDir") || "desc"; // "asc" | "desc"

  const profileWhere: Record<string, unknown> = {};

  if (search) {
    profileWhere.OR = [
      { firstName: { contains: search } },
      { lastName: { contains: search } },
    ];
  }
  if (schools.length > 0) {
    profileWhere.school = { name: { in: schools } };
  }

  profileWhere.cases = { some: {} };

  // Step 1: Get all matching profiles (with names for sort)
  const matchingProfiles = await prisma.profile.findMany({
    where: profileWhere,
    select: { id: true, firstName: true, lastName: true },
  });
  const matchingProfileIds = await filterProfileIdsByAgeRange(
    matchingProfiles.map((p) => p.id),
    ageRange
  );

  if (matchingProfileIds.length === 0) {
    return NextResponse.json({
      profiles: [],
      pagination: { page, limit, total: 0, totalPages: 0 },
    });
  }

  const matchingProfilesById = new Map(
    matchingProfiles
      .filter((profile) => matchingProfileIds.includes(profile.id))
      .map((profile) => [profile.id, profile])
  );

  // Step 2: Filter to repeated-only if requested (≥ 2 different Thai Buddhist years)
  let filteredProfileIds = matchingProfileIds;

  if (repeatedOnly) {
    const allAssessments = await prisma.case.findMany({
      where: {
        profileId: { in: matchingProfileIds },
      },
      select: {
      treatmentNotes: true, profileId: true, createdAt: true },
    });
    const yearsByProfile = new Map<string, Set<number>>();

    for (const a of allAssessments) {
      const local = new Date(a.createdAt.getTime() + 7 * 60 * 60 * 1000);
      const thaiYear = local.getUTCFullYear() + 543;

      if (!yearsByProfile.has(a.profileId))
        yearsByProfile.set(a.profileId, new Set());
      yearsByProfile.get(a.profileId)!.add(thaiYear);
    }
    filteredProfileIds = matchingProfileIds.filter(
      (id) => (yearsByProfile.get(id)?.size ?? 0) > 1
    );
  }

  if (filteredProfileIds.length === 0) {
    return NextResponse.json({
      profiles: [],
      pagination: { page, limit, total: 0, totalPages: 0 },
    });
  }

  // Step 3: Group by profileId to get latest date and raw count
  const grouped = await prisma.case.groupBy({
    by: ["profileId"],
    where: {
      profileId: { in: filteredProfileIds },
    },
    _max: { createdAt: true },
    _count: { id: true },
  });

  // Build merged list for flexible sorting
  const profileNameMap = new Map(
    Array.from(matchingProfilesById.values()).map((p) => [
      p.id,
      { firstName: p.firstName, lastName: p.lastName },
    ])
  );
  const mergedList = grouped.map((g) => ({
    profileId: g.profileId,
    maxDate: g._max.createdAt?.getTime() ?? 0,
    rawCount: g._count.id,
    firstName: profileNameMap.get(g.profileId)?.firstName ?? "",
    lastName: profileNameMap.get(g.profileId)?.lastName ?? "",
  }));

  if (sortBy === "name") {
    mergedList.sort((a, b) => {
      const nameA = `${a.firstName} ${a.lastName}`;
      const nameB = `${b.firstName} ${b.lastName}`;
      const cmp = nameA.localeCompare(nameB, "th");

      return sortDir === "asc" ? cmp : -cmp;
    });
  } else if (sortBy === "count") {
    mergedList.sort((a, b) =>
      sortDir === "asc" ? a.rawCount - b.rawCount : b.rawCount - a.rawCount
    );
  } else {
    // date (default)
    mergedList.sort((a, b) =>
      sortDir === "asc" ? a.maxDate - b.maxDate : b.maxDate - a.maxDate
    );
  }

  const total = mergedList.length;
  const pageSlice = mergedList.slice((page - 1) * limit, page * limit);
  const pageProfileIds = pageSlice.map((g) => g.profileId);

  if (pageProfileIds.length === 0) {
    return NextResponse.json({
      profiles: [],
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  }

  // Step 3: Fetch full profile data for this page
  const profiles = await prisma.profile.findMany({
    where: { id: { in: pageProfileIds } },
    include: {
      school: {
        select: {
          id: true,
          name: true,
          screeningDate: true,
          screenings: {
            select: { round: true, startDate: true, endDate: true },
            orderBy: { round: "asc" },
          },
        },
      },
      cases: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          createdAt: true,
          result: true,
          questionsPhqa: { select: { sum: true } },
          questions9Q: { select: { sum: true } },
          questions2Q: { select: { q1: true, q2: true } },
          questions8Q: { select: { sum: true } },
        },
      },
    },
  });

  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  const result = pageProfileIds
    .map((id) => profileMap.get(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .map((profile) => {
      const byDay = new Map<string, (typeof profile.cases)[0]>();

      for (const q of profile.cases) {
        const dayKey = toThaiDateKey(new Date(q.createdAt));

        if (!byDay.has(dayKey)) byDay.set(dayKey, q);
      }

      const history = Array.from(byDay.values())
        .map((q) => {
          const isNineQ = Array.isArray(q.questions9Q) && q.questions9Q.length > 0;
          const score = isNineQ
            ? Number(q.questions9Q![0].sum)
            : Array.isArray(q.questionsPhqa) && q.questionsPhqa.length > 0
              ? Number(q.questionsPhqa[0].sum)
              : null;
          const q2Risk =
            Array.isArray(q.questions2Q) && q.questions2Q.length > 0
              ? q.questions2Q[0].q1 === 1 || q.questions2Q[0].q2 === 1
              : null;
          const q8Score =
            Array.isArray(q.questions8Q) && q.questions8Q.length > 0 ? Number(q.questions8Q[0].sum) : null;

          return {
            id: q.id,
            date: q.createdAt.toISOString(),
            scale: isNineQ ? "9Q" : "PHQ-A",
            score,
            result: q.result,
            q2Risk,
            q8Score,
          };
        })
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

      const latest = history[history.length - 1] ?? null;

      return {
        profileId: profile.id,
        prefixId: profile.prefixId,
        firstName: profile.firstName,
        lastName: profile.lastName,
        citizenId: profile.citizenId ?? null,
        birthDate: profile.birthDate,
        userId: profile.userId ?? null,
        school: profile.school,
        assessmentCount: history.length,
        latestResult: latest?.result ?? null,
        latestResultText: null,
        latestScore: latest?.score ?? null,
        latestDate: latest?.date ?? null,
        history,
      };
    });

  return NextResponse.json({
    profiles: result,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
