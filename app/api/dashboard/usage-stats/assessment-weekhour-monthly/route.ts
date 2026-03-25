import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/get-session";
import { prisma } from "@/utils/prisma";

const TH_WEEKDAYS = [
  "อาทิตย์",
  "จันทร์",
  "อังคาร",
  "พุธ",
  "พฤหัสบดี",
  "ศุกร์",
  "เสาร์",
] as const;

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

const HOUR_LABELS = [
  8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4,
  5, 6, 7,
] as const;

export async function GET(req: Request) {
  const auth = await requireAdmin();

  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const monthParam = url.searchParams.get("month");
  const dateFromParam = url.searchParams.get("dateFrom");
  const dateToParam = url.searchParams.get("dateTo");

  const parsedFrom = parseDateParam(dateFromParam);
  const parsedTo = parseDateParam(dateToParam);
  const parsedMonth = parseMonthParam(monthParam);
  const now = new Date();

  // ถ้าส่ง date range มา จะใช้ date range (ตีความเป็น “วันตามเวลาไทย”)
  // startUtc = 00:00 (ไทย) -> UTC-7
  // endUtc = (dateTo + 1 วัน) 00:00 (ไทย) -> UTC-7
  const TH_OFFSET_MS = 7 * 60 * 60 * 1000;

  let startUtc: Date;
  let endUtc: Date;
  let label: string;

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
    const year = parsedMonth?.year ?? now.getUTCFullYear();
    const monthIndex = parsedMonth?.monthIndex ?? now.getUTCMonth();

    startUtc = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0));
    endUtc = new Date(Date.UTC(year, monthIndex + 1, 1, 0, 0, 0));
    label = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
  }

  // Heatmap: weekday(0..6) x hour(0..23)
  const cells: number[][] = Array.from({ length: 7 }, () =>
    Array.from({ length: 24 }, () => 0)
  );

  const records = await prisma.questions_Master.findMany({
    where: {
      createdAt: {
        gte: startUtc,
        lt: endUtc,
      },
    },
    select: { createdAt: true },
  });

  // แปลงเวลาเป็นไทย (UTC+7) เพื่อให้ “ชั่วโมง” ตรงกับเวลาที่ผู้ใช้เห็น
  for (const r of records) {
    const th = new Date(r.createdAt.getTime() + TH_OFFSET_MS);
    const weekday = th.getUTCDay(); // 0=Sun..6=Sat (หลัง offset แล้ว)
    const hour = th.getUTCHours(); // 0..23

    cells[weekday][hour] += 1;
  }

  let max = 0;
  let total = 0;

  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      max = Math.max(max, cells[d][h]);
      total += cells[d][h];
    }
  }

  return NextResponse.json({
    monthLabel: label,
    weekdayLabels: TH_WEEKDAYS,
    hourLabels: HOUR_LABELS,
    cells,
    max,
    total,
  });
}
