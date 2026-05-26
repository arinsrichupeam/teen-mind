import { NextResponse } from "next/server";

import {
  type AgeSegmentRow,
  computeAgeSegmentStats,
  emptyAgeSegmentStats,
} from "@/lib/dashboard/age-segment";
import {
  formatThaiDateLabel,
  parseDateParam,
  thaiDateRangeToUtc,
  todayInThailandParts,
} from "@/lib/dashboard/parse-dashboard-date";
import { requireAdmin } from "@/lib/get-session";
import { prisma } from "@/utils/prisma";

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

  let questionCreatedAt: { gte?: Date; lt?: Date } | undefined;
  let label: string | null = "ข้อมูลทั้งหมด";

  if (parsedFrom) {
    const toParts = parsedTo ?? todayInThailandParts();
    const { startUtc, endUtc } = thaiDateRangeToUtc(parsedFrom, toParts);

    questionCreatedAt = { gte: startUtc, lt: endUtc };

    if (parsedTo) {
      label = `${formatThaiDateLabel(parsedFrom)} ถึง ${formatThaiDateLabel(parsedTo)}`;
    } else {
      label = `ตั้งแต่ ${formatThaiDateLabel(parsedFrom)} – ปัจจุบัน`;
    }
  }

  const latestByProfile = await prisma.questions_Master.groupBy({
    by: ["profileId"],
    ...(questionCreatedAt ? { where: { createdAt: questionCreatedAt } } : {}),
    _max: { createdAt: true },
  });

  if (latestByProfile.length === 0) {
    return NextResponse.json(emptyAgeSegmentStats(label));
  }

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
    select: {
      result: true,
      createdAt: true,
      q9: { select: { sum: true }, take: 1 },
      phqa: { select: { sum: true }, take: 1 },
      profile: {
        select: {
          birthday: true,
          school: { select: { screeningDate: true } },
        },
      },
    },
  });

  const rows: AgeSegmentRow[] = latestQuestions.map((q) => {
    const q9Sum = q.q9[0]?.sum;
    const phqaSum = q.phqa[0]?.sum;
    const mainSum =
      typeof q9Sum === "number" && !Number.isNaN(q9Sum)
        ? q9Sum
        : typeof phqaSum === "number" && !Number.isNaN(phqaSum)
          ? phqaSum
          : null;

    return {
      birthday: q.profile.birthday,
      screeningDate: q.profile.school?.screeningDate ?? null,
      questionCreatedAt: q.createdAt,
      result: q.result,
      mainSum,
    };
  });

  return NextResponse.json(computeAgeSegmentStats(rows, label));
}
