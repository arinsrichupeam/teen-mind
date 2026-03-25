import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/get-session";
import { prisma } from "@/utils/prisma";

// const RISK_LEVELS = ["Green", "Green-Low", "Yellow", "Orange", "Red"] as const;

// type RiskLevel = (typeof RISK_LEVELS)[number];

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

export async function GET() {
  const auth = await requireAdmin();

  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const todayStartUtc = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0)
  );

  const DAY_MS = 24 * 60 * 60 * 1000;
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

  for (let i = 4; i >= 0; i--) {
    const start = new Date(todayStartUtc.getTime() - i * DAY_MS);
    const end = new Date(start.getTime() + DAY_MS);

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

    const dayLabel = start.toLocaleDateString("th-TH", {
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
