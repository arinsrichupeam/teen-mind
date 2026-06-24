import { type NextRequest, NextResponse } from "next/server";

import {
  emptyConsultStats,
  emptyRisk,
  type OverviewResponse,
} from "@/lib/dashboard/overview";
import {
  parseDateParam,
  thaiDateRangeToUtc,
} from "@/lib/dashboard/parse-dashboard-date";
import { MAIN_ASSESSMENT_AGE_CUTOFF } from "@/lib/assessment-scale";
import { requireAdmin } from "@/lib/get-session";
import { prisma } from "@/utils/prisma";
import { getNineQRiskLevel, getPhqaRiskLevel } from "@/utils/helper";

function getAge(
  birthday: Date,
  screeningDate: Date | null,
  fallback: Date
): number {
  const target = screeningDate ?? fallback;

  return target.getFullYear() - birthday.getFullYear();
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();

  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const dateFromParam = searchParams.get("dateFrom");
  const dateToParam = searchParams.get("dateTo");

  let createdAtFilter: { gte: Date; lt: Date } | undefined;

  if (dateFromParam && dateToParam) {
    const parsedFrom = parseDateParam(dateFromParam);
    const parsedTo = parseDateParam(dateToParam);

    if (parsedFrom && parsedTo) {
      const { startUtc, endUtc } = thaiDateRangeToUtc(parsedFrom, parsedTo);

      createdAtFilter = { gte: startUtc, lt: endUtc };
    }
  }

  const questions = await prisma.questions_Master.findMany({
    where: createdAtFilter ? { createdAt: createdAtFilter } : undefined,
    select: {
      id: true,
      profileId: true,
      createdAt: true,
      status: true,
      profile: {
        select: {
          birthday: true,
          sex: true,
          school: { select: { screeningDate: true } },
        },
      },
      phqa: { select: { sum: true }, take: 1, orderBy: { id: "asc" } },
      q9: { select: { sum: true }, take: 1, orderBy: { id: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  // latest question per profile (results already ordered desc)
  const latestByProfile = new Map<string, (typeof questions)[number]>();

  for (const q of questions) {
    if (!latestByProfile.has(q.profileId)) {
      latestByProfile.set(q.profileId, q);
    }
  }

  const under18Stats = emptyConsultStats();
  const under18Risk = emptyRisk();
  const age18AndOverStats = emptyConsultStats();
  const age18AndOverRisk = emptyRisk();
  let unclassifiedCount = 0;

  for (const q of Array.from(latestByProfile.values())) {
    const profile = q.profile as {
      birthday: Date | null;
      sex: number;
      school: { screeningDate: Date | null } | null;
    };

    if (!profile.birthday) {
      unclassifiedCount++;
      continue;
    }

    const screeningDate = profile.school?.screeningDate ?? null;
    const age = getAge(profile.birthday, screeningDate, q.createdAt);
    const status = q.status as 0 | 1 | 2 | 3;
    const sex = profile.sex;

    if (age < MAIN_ASSESSMENT_AGE_CUTOFF) {
      under18Stats.total++;
      if (sex === 1) under18Stats.gender.male++;
      else if (sex === 2) under18Stats.gender.female++;
      else under18Stats.gender.other++;

      if (status === 0) under18Stats.consult.awaitingHn++;
      else if (status === 1) under18Stats.consult.awaitingConsult++;
      else if (status === 2) under18Stats.consult.awaitingSummary++;
      else under18Stats.consult.completed++;

      const phqaSum = (q.phqa as { sum: number }[])[0]?.sum;

      if (phqaSum !== undefined) {
        const level = getPhqaRiskLevel(phqaSum);

        if (level) {
          if (level === "Green") under18Risk.green++;
          else if (level === "Green-Low") under18Risk.greenLow++;
          else if (level === "Yellow") under18Risk.yellow++;
          else if (level === "Orange") under18Risk.orange++;
          else if (level === "Red") under18Risk.red++;
          under18Risk.totalUsers++;
        }
      }
    } else {
      age18AndOverStats.total++;
      if (sex === 1) age18AndOverStats.gender.male++;
      else if (sex === 2) age18AndOverStats.gender.female++;
      else age18AndOverStats.gender.other++;

      if (status === 0) age18AndOverStats.consult.awaitingHn++;
      else if (status === 1) age18AndOverStats.consult.awaitingConsult++;
      else if (status === 2) age18AndOverStats.consult.awaitingSummary++;
      else age18AndOverStats.consult.completed++;

      const q9Sum = (q.q9 as { sum: number }[])[0]?.sum;

      if (q9Sum !== undefined) {
        const level = getNineQRiskLevel(q9Sum);
        const normalized = level === "Green-Low" ? "Green" : level;

        if (normalized === "Green") age18AndOverRisk.green++;
        else if (normalized === "Yellow") age18AndOverRisk.yellow++;
        else if (normalized === "Orange") age18AndOverRisk.orange++;
        else if (normalized === "Red") age18AndOverRisk.red++;
        age18AndOverRisk.totalUsers++;
      }
    }
  }

  const response: OverviewResponse = {
    under18: { stats: under18Stats, risk: under18Risk },
    age18AndOver: { stats: age18AndOverStats, risk: age18AndOverRisk },
    unclassifiedCount,
  };

  return NextResponse.json(response);
}
