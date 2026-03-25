import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/get-session";
import { prisma } from "@/utils/prisma";

const RISK_LEVELS = ["Green", "Green-Low", "Yellow", "Orange", "Red"] as const;

type RiskLevel = (typeof RISK_LEVELS)[number];

export async function GET(req: Request) {
  const auth = await requireAdmin();

  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const startParam = url.searchParams.get("start");
  const endParam = url.searchParams.get("end");
  const riskParam = url.searchParams.get("risk");
  const pageParam = url.searchParams.get("page");
  const pageSizeParam = url.searchParams.get("pageSize");

  const start = startParam ? Number(startParam) : NaN;
  const end = endParam ? Number(endParam) : NaN;
  const page = pageParam ? Math.max(Number(pageParam), 1) : 1;
  const pageSize = pageSizeParam ? Math.max(Number(pageSizeParam), 1) : 10;

  const risk = RISK_LEVELS.includes(riskParam as RiskLevel)
    ? (riskParam as RiskLevel)
    : null;

  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    start >= end ||
    !risk
  ) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  const profiles = await prisma.profile.findMany({
    where: {
      createdAt: {
        gte: new Date(start),
        lt: new Date(end),
      },
      questions: { some: {} },
    },
    select: { id: true },
  });

  const profileIds = profiles.map((p) => p.id);

  if (profileIds.length === 0) {
    return NextResponse.json({ items: [] });
  }

  // หา “แบบประเมินล่าสุดต่อ 1 profile” แบบแม่นยำด้วย groupBy max(createdAt)
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
      profile: {
        select: {
          firstname: true,
          lastname: true,
        },
      },
    },
  });

  const filteredLatestQuestions = latestQuestions
    .filter((q) => q.result === risk)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((q) => ({
      profileId: q.profileId,
      createdAt: q.createdAt.toISOString(),
      name: `${q.profile?.firstname ?? ""} ${q.profile?.lastname ?? ""}`.trim(),
    }));

  const total = filteredLatestQuestions.length;
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const safePage = Math.min(page, totalPages);

  const items = filteredLatestQuestions.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  return NextResponse.json({
    items,
    risk,
    total,
    page: safePage,
    pageSize,
  });
}
