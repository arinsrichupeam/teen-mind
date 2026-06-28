import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/get-session";
import { prisma } from "@/utils/prisma";

const THAI_MONTHS = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
] as const;

export async function GET() {
  const auth = await requireAdmin();

  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  // เริ่มจาก “เดือนแรกที่มีบันทึกจริง” (อิง profile.createdAt)
  const [minProfile, maxProfile] = await Promise.all([
    prisma.profile.findFirst({
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    }),
    prisma.profile.findFirst({
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
  ]);

  if (!minProfile?.createdAt || !maxProfile?.createdAt) {
    return NextResponse.json({ usageStats: [] });
  }

  const minDate = minProfile.createdAt;
  const maxDate = maxProfile.createdAt;

  const minYear = minDate.getUTCFullYear();
  const minMonth = minDate.getUTCMonth();
  const maxYear = maxDate.getUTCFullYear();
  const maxMonth = maxDate.getUTCMonth();

  const usageStats: Array<{
    yearBe: number;
    monthLabel: string;
    totalUse: number;
    totalUsers: number;
    male: number;
    female: number;
    unspecified: number;
    green: number;
    greenLow: number;
    yellow: number;
    orange: number;
    red: number;
  }> = [];

  // ไล่รายเดือนตั้งแต่เดือนแรก -> เดือนล่าสุด (in UTC เพื่อความสม่ำเสมอ)
  const cursorEnd = new Date(Date.UTC(maxYear, maxMonth, 1));
  let cursor = new Date(Date.UTC(minYear, minMonth, 1));

  while (cursor <= cursorEnd) {
    const cursorYear = cursor.getUTCFullYear();
    const cursorMonth = cursor.getUTCMonth();
    const yearBe = cursorYear + 543;
    const start = cursor;
    const end = new Date(Date.UTC(cursorYear, cursorMonth + 1, 1));

    const totalUse = await prisma.profile.count({
      where: {
        createdAt: {
          gte: start,
          lt: end,
        },
      },
    });

    const sexGroups = await prisma.profile.groupBy({
      by: ["sex"],
      where: { createdAt: { gte: start, lt: end } },
      _count: { id: true },
    });
    const male = sexGroups.find((g) => g.sex === 1)?._count.id ?? 0;
    const female = sexGroups.find((g) => g.sex === 2)?._count.id ?? 0;
    const unspecified = sexGroups.find((g) => g.sex === 3)?._count.id ?? 0;

    // ดึง questions ที่ทำในเดือนนั้น (อ้างอิง createdAt ของ questions_Master)
    const questionsInMonth = await prisma.questions_Master.findMany({
      where: { createdAt: { gte: start, lt: end } },
      select: { profileId: true, result: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    // นับ unique profiles ที่ทำแบบประเมินในเดือนนั้น และเลือก result ล่าสุดต่อ 1 profile
    const seen = new Set<string>();
    const riskCounts = {
      green: 0,
      greenLow: 0,
      yellow: 0,
      orange: 0,
      red: 0,
    };

    for (const q of questionsInMonth) {
      if (seen.has(q.profileId)) continue;
      seen.add(q.profileId);

      const c = getRiskCounts(q.result);

      riskCounts.green += c.green;
      riskCounts.greenLow += c.greenLow;
      riskCounts.yellow += c.yellow;
      riskCounts.orange += c.orange;
      riskCounts.red += c.red;
    }

    const totalUsers = questionsInMonth.length;

    usageStats.push({
      yearBe,
      monthLabel: THAI_MONTHS[cursorMonth],
      totalUse,
      totalUsers,
      male,
      female,
      unspecified,
      green: riskCounts.green,
      greenLow: riskCounts.greenLow,
      yellow: riskCounts.yellow,
      orange: riskCounts.orange,
      red: riskCounts.red,
    });

    cursor = new Date(Date.UTC(cursorYear, cursorMonth + 1, 1));
  }

  return NextResponse.json({ usageStats });
}
