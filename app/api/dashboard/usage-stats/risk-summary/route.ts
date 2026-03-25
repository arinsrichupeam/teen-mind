import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/get-session";
import { prisma } from "@/utils/prisma";

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

  const parsedFrom = parseDateParam(dateFromParam);
  const parsedTo = parseDateParam(dateToParam);

  // ถ้ากำหนด date range: ตีความเป็น “วันตามเวลาไทย”
  const TH_OFFSET_MS = 7 * 60 * 60 * 1000;

  let startUtc: Date | null = null;
  let endUtc: Date | null = null;
  let label: string | null = null;

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
    endUtc = new Date(toUtcNextMidnight - TH_OFFSET_MS);
    label = `${dateFromParam} ถึง ${dateToParam}`;
  } else {
    // default: “เดือนล่าสุด” จาก profile.createdAt
    const maxProfile = await prisma.profile.findFirst({
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });

    const base = maxProfile?.createdAt ?? new Date();
    const year = base.getUTCFullYear();
    const monthIndex = base.getUTCMonth();

    startUtc = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0));
    endUtc = new Date(Date.UTC(year, monthIndex + 1, 1, 0, 0, 0));
    label = `${year + 543} ${base.toLocaleString("th-TH", { month: "long" })}`;
  }

  const profilesWithQuestions = await prisma.profile.findMany({
    where: {
      createdAt: { gte: startUtc, lt: endUtc },
      questions: { some: {} },
    },
    select: { id: true },
  });

  const profileIds = profilesWithQuestions.map((p) => p.id);

  if (profileIds.length === 0) {
    return NextResponse.json({
      label,
      totalUsers: 0,
      green: 0,
      greenLow: 0,
      yellow: 0,
      orange: 0,
      red: 0,
    });
  }

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
      OR: orConditions as Array<{ profileId: string; createdAt: Date }>,
    },
    select: { result: true },
  });

  const riskCounts = {
    green: 0,
    greenLow: 0,
    yellow: 0,
    orange: 0,
    red: 0,
  };

  for (const q of latestQuestions) {
    const c = getRiskCounts(q.result);

    riskCounts.green += c.green;
    riskCounts.greenLow += c.greenLow;
    riskCounts.yellow += c.yellow;
    riskCounts.orange += c.orange;
    riskCounts.red += c.red;
  }

  return NextResponse.json({
    label,
    totalUsers: profileIds.length,
    ...riskCounts,
  });
}
