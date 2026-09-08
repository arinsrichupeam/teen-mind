import { ScreeningResult } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";

import {
  parseDateParam,
  thaiDateRangeToUtc,
} from "@/lib/dashboard/parse-dashboard-date";
import { requireAdmin } from "@/lib/get-session";
import { prisma } from "@/utils/prisma";

export type SchoolStat = {
  schoolName: string;
  total: number;
  green: number;
  greenLow: number;
  yellow: number;
  orange: number;
  red: number;
};

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
    where: {
      ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
      profile: { schoolId: { not: null } },
    },
    select: {
      profileId: true,
      result: true,
      createdAt: true,
      profile: {
        select: {
          school: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // latest question per profile
  const latestByProfile = new Map<string, (typeof questions)[number]>();

  for (const q of questions) {
    if (!latestByProfile.has(q.profileId)) {
      latestByProfile.set(q.profileId, q);
    }
  }

  const schoolMap = new Map<string, SchoolStat>();

  for (const q of Array.from(latestByProfile.values())) {
    const schoolName =
      (q.profile as { school: { name: string } | null }).school?.name ??
      "ไม่ระบุโรงเรียน";

    if (!schoolMap.has(schoolName)) {
      schoolMap.set(schoolName, {
        schoolName,
        total: 0,
        green: 0,
        greenLow: 0,
        yellow: 0,
        orange: 0,
        red: 0,
      });
    }

    const stat = schoolMap.get(schoolName)!;

    stat.total++;
    if (q.result === ScreeningResult.NEGATIVE) stat.green++;
    else if (q.result === ScreeningResult.POSITIVE_LOW) stat.greenLow++;
    else if (q.result === ScreeningResult.POSITIVE_MODERATE) stat.yellow++;
    else if (q.result === ScreeningResult.POSITIVE_HIGH) stat.orange++;
    else if (q.result === ScreeningResult.POSITIVE_SEVERE) stat.red++;
  }

  const schools = Array.from(schoolMap.values()).sort(
    (a, b) => b.total - a.total
  );

  const summary = schools.reduce(
    (acc, s) => {
      acc.total += s.total;
      acc.green += s.green;
      acc.greenLow += s.greenLow;
      acc.yellow += s.yellow;
      acc.orange += s.orange;
      acc.red += s.red;

      return acc;
    },
    {
      schoolName: "รวมทั้งหมด",
      total: 0,
      green: 0,
      greenLow: 0,
      yellow: 0,
      orange: 0,
      red: 0,
    } as SchoolStat
  );

  return NextResponse.json({ schools, summary });
}
