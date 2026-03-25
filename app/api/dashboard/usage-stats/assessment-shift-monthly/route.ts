import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/get-session";
import { prisma } from "@/utils/prisma";

const SHIFT_DEFS = [
  { label: "ดึก", fromHour: 0, toHour: 7 }, // 00-07
  { label: "เช้า", fromHour: 8, toHour: 15 }, // 08-15
  { label: "บ่าย", fromHour: 16, toHour: 23 }, // 16-23
] as const;

type ShiftDef = (typeof SHIFT_DEFS)[number];

const getShiftIndex = (hour: number) => {
  if (hour >= SHIFT_DEFS[0].fromHour && hour <= SHIFT_DEFS[0].toHour) return 0;
  if (hour >= SHIFT_DEFS[1].fromHour && hour <= SHIFT_DEFS[1].toHour) return 1;

  return 2;
};

const parseMonthParam = (monthParam: string | null) => {
  // Expected: YYYY-MM (เช่น 2026-03)
  if (!monthParam) return null;
  const m = monthParam.match(/^(\d{4})-(\d{2})$/);

  if (!m) return null;

  const year = Number(m[1]);
  const monthIndex = Number(m[2]) - 1;

  if (!Number.isFinite(year) || !Number.isFinite(monthIndex)) return null;
  if (monthIndex < 0 || monthIndex > 11) return null;

  return { year, monthIndex };
};

export async function GET(req: Request) {
  const auth = await requireAdmin();

  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const monthParam = url.searchParams.get("month");

  const parsedMonth = parseMonthParam(monthParam);
  const now = new Date();

  const year = parsedMonth?.year ?? now.getUTCFullYear();
  const monthIndex = parsedMonth?.monthIndex ?? now.getUTCMonth();

  const startUtc = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0));
  const endUtc = new Date(Date.UTC(year, monthIndex + 1, 1, 0, 0, 0));

  // จำนวนวันในเดือน (UTC)
  const dayCount = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

  const cells: number[][] = Array.from({ length: dayCount }, () =>
    Array.from({ length: SHIFT_DEFS.length }, () => 0)
  );

  const records = await prisma.questions_Master.findMany({
    where: {
      createdAt: {
        gte: startUtc,
        lt: endUtc,
      },
    },
    select: {
      createdAt: true,
    },
  });

  for (const r of records) {
    const dayIndex = Math.floor(
      (r.createdAt.getTime() - startUtc.getTime()) / (24 * 60 * 60 * 1000)
    );

    if (dayIndex < 0 || dayIndex >= dayCount) continue;

    const hour = r.createdAt.getUTCHours();
    const shiftIndex = getShiftIndex(hour);

    cells[dayIndex][shiftIndex] += 1;
  }

  let max = 0;

  for (let d = 0; d < dayCount; d++) {
    for (let s = 0; s < SHIFT_DEFS.length; s++) {
      max = Math.max(max, cells[d][s]);
    }
  }

  const daysLabels = Array.from({ length: dayCount }, (_, i) => {
    const dt = new Date(Date.UTC(year, monthIndex, i + 1, 0, 0, 0));

    return dt.toLocaleDateString("th-TH", {
      day: "2-digit",
      month: "2-digit",
    });
  });

  const shiftLabels = SHIFT_DEFS.map((s: ShiftDef) => {
    const from = String(s.fromHour).padStart(2, "0");
    const to = String(s.toHour).padStart(2, "0");

    return `${s.label} (${from}-${to})`;
  });

  return NextResponse.json({
    monthLabel: `${year}-${String(monthIndex + 1).padStart(2, "0")}`,
    daysLabels,
    shiftLabels,
    cells,
    max,
    startUtc: startUtc.toISOString(),
    endUtc: endUtc.toISOString(),
  });
}
