import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/get-session";
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
  const ageRange = url.searchParams.get("ageRange")?.trim() || "all";
  const repeatedOnly = url.searchParams.get("repeated") === "true";
  const sortBy = url.searchParams.get("sortBy") || "date"; // "date" | "name" | "count"
  const sortDir = url.searchParams.get("sortDir") || "desc"; // "asc" | "desc"

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

  if (ageRange !== "all") {
    const currentYear = new Date().getFullYear();

    if (ageRange === "under18") {
      profileWhere.birthday = { gte: new Date(`${currentYear - 17}-01-01`) };
    } else if (ageRange === "18plus") {
      profileWhere.birthday = { lt: new Date(`${currentYear - 17}-01-01`) };
    }
  }

  // Step 1: Get all matching profiles (with names for sort)
  const matchingProfiles = await prisma.profile.findMany({
    where: profileWhere,
    select: { id: true, firstname: true, lastname: true },
  });
  const matchingProfileIds = matchingProfiles.map((p) => p.id);

  if (matchingProfileIds.length === 0) {
    return NextResponse.json({
      profiles: [],
      pagination: { page, limit, total: 0, totalPages: 0 },
    });
  }

  // Step 2: Filter to repeated-only if requested (≥ 2 different Thai Buddhist years)
  let filteredProfileIds = matchingProfileIds;

  if (repeatedOnly) {
    const allAssessments = await prisma.questions_Master.findMany({
      where: {
        profileId: { in: matchingProfileIds },
      },
      select: { profileId: true, createdAt: true },
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
  const grouped = await prisma.questions_Master.groupBy({
    by: ["profileId"],
    where: {
      profileId: { in: filteredProfileIds },
    },
    _max: { createdAt: true },
    _count: { id: true },
  });

  // Build merged list for flexible sorting
  const profileNameMap = new Map(
    matchingProfiles.map((p) => [
      p.id,
      { firstname: p.firstname, lastname: p.lastname },
    ])
  );
  const mergedList = grouped.map((g) => ({
    profileId: g.profileId,
    maxDate: g._max.createdAt?.getTime() ?? 0,
    rawCount: g._count.id,
    firstname: profileNameMap.get(g.profileId)?.firstname ?? "",
    lastname: profileNameMap.get(g.profileId)?.lastname ?? "",
  }));

  if (sortBy === "name") {
    mergedList.sort((a, b) => {
      const nameA = `${a.firstname} ${a.lastname}`;
      const nameB = `${b.firstname} ${b.lastname}`;
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
      school: { select: { id: true, name: true, screeningDate: true } },
      questions: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          createdAt: true,
          result: true,
          result_text: true,
          phqa: { select: { sum: true } },
          q9: { select: { sum: true } },
          q2: { select: { q1: true, q2: true } },
          q8: { select: { sum: true } },
        },
      },
    },
  });

  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  const result = pageProfileIds
    .map((id) => profileMap.get(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .map((profile) => {
      const byDay = new Map<string, (typeof profile.questions)[0]>();

      for (const q of profile.questions) {
        const dayKey = toThaiDateKey(new Date(q.createdAt));

        if (!byDay.has(dayKey)) byDay.set(dayKey, q);
      }

      const history = Array.from(byDay.values())
        .map((q) => {
          const isNineQ = Array.isArray(q.q9) && q.q9.length > 0;
          const score = isNineQ
            ? Number(q.q9![0].sum)
            : Array.isArray(q.phqa) && q.phqa.length > 0
              ? Number(q.phqa[0].sum)
              : null;
          const q2Risk =
            Array.isArray(q.q2) && q.q2.length > 0
              ? q.q2[0].q1 === 1 || q.q2[0].q2 === 1
              : null;
          const q8Score =
            Array.isArray(q.q8) && q.q8.length > 0 ? Number(q.q8[0].sum) : null;

          return {
            id: q.id,
            date: q.createdAt.toISOString(),
            scale: isNineQ ? "9Q" : "PHQ-A",
            score,
            result: q.result,
            result_text: q.result_text,
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
        firstname: profile.firstname,
        lastname: profile.lastname,
        citizenId: profile.citizenId ?? null,
        birthday: profile.birthday,
        userId: profile.userId ?? null,
        school: profile.school,
        assessmentCount: history.length,
        latestResult: latest?.result ?? null,
        latestResultText: latest?.result_text ?? null,
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
