import { NextResponse } from "next/server";

import {
  computePsychologistProductivity,
  emptyPsychologistProductivityStats,
} from "@/lib/dashboard/psychologist-productivity";
import {
  formatThaiDateLabel,
  parseDateParam,
  thaiDateRangeToUtc,
  todayInThailandParts,
} from "@/lib/dashboard/parse-dashboard-date";
import { requireAdmin } from "@/lib/get-session";
import { prefix } from "@/utils/data";
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

  let dateRange: { startUtc: Date; endUtc: Date } | undefined;
  let label: string | null = "ข้อมูลทั้งหมด";

  if (parsedFrom) {
    const toParts = parsedTo ?? todayInThailandParts();
    const range = thaiDateRangeToUtc(parsedFrom, toParts);

    dateRange = range;

    if (parsedTo) {
      label = `${formatThaiDateLabel(parsedFrom)} ถึง ${formatThaiDateLabel(parsedTo)}`;
    } else {
      label = `ตั้งแต่ ${formatThaiDateLabel(parsedFrom)} – ปัจจุบัน`;
    }
  }

  const [questions, admins] = await Promise.all([
    prisma.questions_Master.findMany({
      where: {
        OR: [
          { consult: { not: null } },
          { consult2: { not: null } },
          { consult3: { not: null } },
        ],
      },
      select: {
        id: true,
        profileId: true,
        createdAt: true,
        consult: true,
        consult2: true,
        consult3: true,
        schedule_telemed: true,
        schedule_telemed2: true,
        schedule_telemed3: true,
        subjective: true,
        objective: true,
        assessment: true,
        plan: true,
        subjective2: true,
        objective2: true,
        assessment2: true,
        plan2: true,
        subjective3: true,
        objective3: true,
        assessment3: true,
        plan3: true,
      },
    }),
    prisma.profile_Admin.findMany({
      select: {
        userId: true,
        prefixId: true,
        firstname: true,
        lastname: true,
      },
    }),
  ]);

  const hasAssignedConsult = questions.some(
    (q) =>
      (q.consult && q.consult.trim() !== "") ||
      (q.consult2 && q.consult2.trim() !== "") ||
      (q.consult3 && q.consult3.trim() !== "")
  );

  if (!hasAssignedConsult) {
    return NextResponse.json(emptyPsychologistProductivityStats(label));
  }

  const adminLookup = new Map(
    admins.map((admin) => [
      admin.userId,
      {
        prefixId: admin.prefixId,
        firstname: admin.firstname,
        lastname: admin.lastname,
      },
    ])
  );
  const prefixMap = new Map(prefix.map((p) => [p.key, p.label]));

  const stats = computePsychologistProductivity(
    questions,
    adminLookup,
    prefixMap,
    label,
    dateRange
  );

  return NextResponse.json(stats);
}
