import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/get-session";
import { prisma } from "@/utils/prisma";

export async function GET(req: Request) {
  const auth = await requireAdmin();

  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const daysParam = url.searchParams.get("days");
  const days = daysParam ? Math.max(Number(daysParam), 1) : 7;
  const safeDays = Math.min(days, 30);

  const now = new Date();
  const startUtc = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - (safeDays - 1),
      0,
      0,
      0
    )
  );
  const endUtc = new Date(startUtc.getTime() + safeDays * 24 * 60 * 60 * 1000);

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

  const cells: number[][] = Array.from({ length: safeDays }, () =>
    Array.from({ length: 24 }, () => 0)
  );

  for (const r of records) {
    const t = r.createdAt.getTime();
    const dayIndex = Math.floor(
      (t - startUtc.getTime()) / (24 * 60 * 60 * 1000)
    );

    if (dayIndex < 0 || dayIndex >= safeDays) continue;
    const hour = r.createdAt.getUTCHours();

    cells[dayIndex][hour] += 1;
  }

  let max = 0;

  for (let d = 0; d < safeDays; d++) {
    for (let h = 0; h < 24; h++) {
      max = Math.max(max, cells[d][h]);
    }
  }

  const daysLabels = Array.from({ length: safeDays }, (_, i) => {
    const dt = new Date(startUtc.getTime() + i * 24 * 60 * 60 * 1000);

    return dt.toLocaleDateString("th-TH", {
      day: "2-digit",
      month: "2-digit",
    });
  });

  const heatmapHours = Array.from({ length: 24 }, (_, hour) => hour);

  return NextResponse.json({
    daysLabels,
    hours: heatmapHours,
    cells,
    max,
    startUtc: startUtc.toISOString(),
    endUtc: endUtc.toISOString(),
  });
}
