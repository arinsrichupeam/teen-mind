import { CaseStatus, Sex } from "@prisma/client";
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
import { resolveSchoolScreeningDate } from "@/lib/school-screening";
import { prisma } from "@/utils/prisma";
import { getNineQRiskLevel, getPhqaRiskLevel } from "@/utils/helper";

function getAge(
  birthDate: Date,
  screeningDate: Date | null,
  fallback: Date
): number {
  const target = screeningDate ?? fallback;

  return target.getFullYear() - birthDate.getFullYear();
}

/** Map CaseStatus to legacy consult-progress buckets (0–3) for overview UI. */
function caseStatusToLegacyBucket(status: CaseStatus): 0 | 1 | 2 | 3 {
  switch (status) {
    case CaseStatus.CLOSED:
      return 3;
    case CaseStatus.IN_PROGRESS:
    case CaseStatus.TRANSFER_PENDING:
      return 2;
    case CaseStatus.PENDING:
    default:
      return 1;
  }
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

  const questions = await prisma.case.findMany({
    where: createdAtFilter ? { createdAt: createdAtFilter } : undefined,
    select: {
      id: true,
      profileId: true,
      createdAt: true,
      status: true,
      profile: {
        select: {
          birthDate: true,
          sex: true,
          school: {
            select: {
              screeningDate: true,
              screenings: {
                select: { round: true, startDate: true, endDate: true },
                orderBy: { round: "asc" },
              },
            },
          },
        },
      },
      questionsPhqa: { select: { sum: true }, take: 1, orderBy: { id: "asc" } },
      questions9Q: { select: { sum: true }, take: 1, orderBy: { id: "asc" } },
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
    const profile = q.profile;

    if (!profile.birthDate) {
      unclassifiedCount++;
      continue;
    }

    const screeningDate = resolveSchoolScreeningDate(
      profile.school?.screenings,
      q.createdAt,
      profile.school?.screeningDate ?? null
    );
    const age = getAge(profile.birthDate, screeningDate, q.createdAt);
    const status = caseStatusToLegacyBucket(q.status);
    const sex = profile.sex;

    if (age < MAIN_ASSESSMENT_AGE_CUTOFF) {
      under18Stats.total++;
      if (sex === Sex.MALE) under18Stats.gender.male++;
      else if (sex === Sex.FEMALE) under18Stats.gender.female++;
      else under18Stats.gender.other++;

      if (status === 0) under18Stats.consult.awaitingHn++;
      else if (status === 1) under18Stats.consult.awaitingConsult++;
      else if (status === 2) under18Stats.consult.awaitingSummary++;
      else under18Stats.consult.completed++;

      const phqaSum = (q.questionsPhqa as { sum: number }[])[0]?.sum;

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
      if (sex === Sex.MALE) age18AndOverStats.gender.male++;
      else if (sex === Sex.FEMALE) age18AndOverStats.gender.female++;
      else age18AndOverStats.gender.other++;

      if (status === 0) age18AndOverStats.consult.awaitingHn++;
      else if (status === 1) age18AndOverStats.consult.awaitingConsult++;
      else if (status === 2) age18AndOverStats.consult.awaitingSummary++;
      else age18AndOverStats.consult.completed++;

      const q9Sum = (q.questions9Q as { sum: number }[])[0]?.sum;

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
