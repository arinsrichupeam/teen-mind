import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/get-session";
import { prisma } from "@/utils/prisma";

// const RISK_LEVELS = ["Green", "Green-Low", "Yellow", "Orange", "Red"] as const;

// type RiskLevel = (typeof RISK_LEVELS)[number];
const parseDateParam = (dateParam: string | null) => {
  // Expected: YYYY-MM-DD
  if (!dateParam) return null;
  const m = dateParam.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!m) return null;
  const year = Number(m[1]);
  const monthIndex = Number(m[2]) - 1;
  const day = Number(m[3]);

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(monthIndex) ||
    !Number.isFinite(day)
  ) {
    return null;
  }
  if (monthIndex < 0 || monthIndex > 11) return null;
  if (day < 1 || day > 31) return null;

  return { year, monthIndex, day };
};

const getRiskCounts = (result: string) => {
  switch (result) {
    case "Green":
      return { green: 1, greenLow: 0, yellow: 0, orange: 0, red: 0 };
    case "Green-Low":
      return { green: 0, greenLow: 1, yellow: 0, orange: 0, red: 0 };
    case "Yellow":
      return { green: 0, greenLow: 0, yellow: 1, orange: 0, red: 0 };
    case "Orange":
      return { green: 0, greenLow: 0, yellow: 0, orange: 1, red: 0 };
    case "Red":
      return { green: 0, greenLow: 0, yellow: 0, orange: 0, red: 1 };
    default:
      return { green: 0, greenLow: 0, yellow: 0, orange: 0, red: 0 };
  }
};

export async function GET(req: Request) {
  const auth = await requireAdmin();

  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const dateFromParam = url.searchParams.get("dateFrom");
  const dateToParam = url.searchParams.get("dateTo");

  // ตีความเป็น “วันตามเวลาไทย”
  const TH_OFFSET_MS = 7 * 60 * 60 * 1000;
  const DAY_MS = 24 * 60 * 60 * 1000;

  const parsedFrom = parseDateParam(dateFromParam);
  const parsedTo = parseDateParam(dateToParam);

  // Guard: อย่าให้ query ช่วงยาวมาก เพราะแต่ละวันมีหลาย query ฝั่ง prisma
  const MAX_DAYS = 30;

  let startUtc: Date;
  let endUtcExclusive: Date;

  if (parsedFrom && parsedTo) {
    const fromUtcMidnight = Date.UTC(
      parsedFrom.year,
      parsedFrom.monthIndex,
      parsedFrom.day,
      0,
      0,
      0
    );
    const toUtcNextMidnight = Date.UTC(
      parsedTo.year,
      parsedTo.monthIndex,
      parsedTo.day + 1,
      0,
      0,
      0
    );

    startUtc = new Date(fromUtcMidnight - TH_OFFSET_MS);
    endUtcExclusive = new Date(toUtcNextMidnight - TH_OFFSET_MS);

    const totalDays = Math.round(
      (endUtcExclusive.getTime() - startUtc.getTime()) / DAY_MS
    );

    if (!Number.isFinite(totalDays) || totalDays <= 0) {
      return NextResponse.json(
        { error: "Invalid date range" },
        { status: 400 }
      );
    }
    if (totalDays > MAX_DAYS) {
      return NextResponse.json(
        { error: `Date range too large (max ${MAX_DAYS} days)` },
        { status: 400 }
      );
    }
  } else {
    // Default: 7 วันล่าสุด (รวมวันนี้) ตามวันเวลาไทย
    const now = new Date();
    const thaiToday = new Date(now.getTime() + TH_OFFSET_MS);
    const thaiTodayStartUtc = new Date(
      Date.UTC(
        thaiToday.getUTCFullYear(),
        thaiToday.getUTCMonth(),
        thaiToday.getUTCDate(),
        0,
        0,
        0
      ) - TH_OFFSET_MS
    );

    startUtc = new Date(thaiTodayStartUtc.getTime() - 6 * DAY_MS);
    endUtcExclusive = new Date(thaiTodayStartUtc.getTime() + DAY_MS);
  }

  const days: Array<{
    dayLabel: string;
    totalUse: number;
    totalUsers: number;
    green: number;
    greenLow: number;
    yellow: number;
    orange: number;
    red: number;
  }> = [];

  for (let t = startUtc.getTime(); t < endUtcExclusive.getTime(); t += DAY_MS) {
    const start = new Date(t);
    const end = new Date(t + DAY_MS);

    const totalUse = await prisma.profile.count({
      where: {
        createdAt: { gte: start, lt: end },
      },
    });

    const profilesWithQuestions = await prisma.profile.findMany({
      where: {
        createdAt: { gte: start, lt: end },
        questions: { some: {} },
      },
      select: { id: true },
    });

    const totalUsers = profilesWithQuestions.length;
    const riskCounts = {
      green: 0,
      greenLow: 0,
      yellow: 0,
      orange: 0,
      red: 0,
    };

    if (totalUsers > 0) {
      const profileIds = profilesWithQuestions.map((p) => p.id);

      const latestByProfile = await prisma.questions_Master.groupBy({
        by: ["profileId"],
        where: { profileId: { in: profileIds } },
        _max: { createdAt: true },
      });

      const orConditions = latestByProfile
        .map((row) => {
          if (!row._max.createdAt) return null;

          return { profileId: row.profileId, createdAt: row._max.createdAt };
        })
        .filter(Boolean);

      const latestQuestions = await prisma.questions_Master.findMany({
        where: {
          OR: orConditions as Array<{
            profileId: string;
            createdAt: Date;
          }>,
        },
        select: {
          profileId: true,
          result: true,
          createdAt: true,
        },
      });

      for (const q of latestQuestions) {
        const c = getRiskCounts(q.result);

        riskCounts.green += c.green;
        riskCounts.greenLow += c.greenLow;
        riskCounts.yellow += c.yellow;
        riskCounts.orange += c.orange;
        riskCounts.red += c.red;
      }
    }

    // Convert start (UTC) -> Thai local date for correct day/month label
    const thaiDate = new Date(start.getTime() + TH_OFFSET_MS);
    const dayLabel = thaiDate.toLocaleDateString("th-TH", {
      day: "2-digit",
      month: "short",
    });

    days.push({
      dayLabel,
      totalUse,
      totalUsers,
      green: riskCounts.green,
      greenLow: riskCounts.greenLow,
      yellow: riskCounts.yellow,
      orange: riskCounts.orange,
      red: riskCounts.red,
    });
  }

  return NextResponse.json({ last7Days: days });
}
