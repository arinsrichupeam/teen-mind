import { ScreeningResult } from "@prisma/client";
import { NextResponse } from "next/server";

import { flattenTreatmentNotes } from "@/lib/case-flat";
import {
  computePsychologistProductivity,
  type QuestionLike,
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

  const [cases, admins] = await Promise.all([
    prisma.case.findMany({
      where: {
        OR: [
          { treatmentNotes: { some: {} } },
          { result: ScreeningResult.POSITIVE_SEVERE },
        ],
      },
      select: {
        treatmentNotes: true,
        id: true,
        profileId: true,
        status: true,
        createdAt: true,
        result: true,
      },
    }),
    prisma.profileAdmin.findMany({
      select: {
        userId: true,
        prefixId: true,
        firstName: true,
        lastName: true,
      },
    }),
  ]);

  const adminLookup = new Map(
    admins.map((admin) => [
      admin.userId,
      {
        prefixId: admin.prefixId,
        firstName: admin.firstName,
        lastName: admin.lastName,
      },
    ])
  );
  const prefixMap = new Map(prefix.map((p) => [p.key, p.label]));

  const questions: QuestionLike[] = cases.map((c) => {
    const flat = flattenTreatmentNotes(c.treatmentNotes);

    return {
      id: c.id,
      profileId: c.profileId,
      createdAt: c.createdAt,
      status: null,
      result: c.result,
      consult: (flat.consult as string | null) ?? null,
      consult2: (flat.consult2 as string | null) ?? null,
      consult3: (flat.consult3 as string | null) ?? null,
      schedule_telemed: (flat.schedule_telemed as Date | null) ?? null,
      schedule_telemed2: (flat.schedule_telemed2 as Date | null) ?? null,
      schedule_telemed3: (flat.schedule_telemed3 as Date | null) ?? null,
      subjective: (flat.subjective as string | null) ?? null,
      objective: (flat.objective as string | null) ?? null,
      assessment: (flat.assessment as string | null) ?? null,
      plan: (flat.plan as string | null) ?? null,
      subjective2: (flat.subjective2 as string | null) ?? null,
      objective2: (flat.objective2 as string | null) ?? null,
      assessment2: (flat.assessment2 as string | null) ?? null,
      plan2: (flat.plan2 as string | null) ?? null,
      subjective3: (flat.subjective3 as string | null) ?? null,
      objective3: (flat.objective3 as string | null) ?? null,
      assessment3: (flat.assessment3 as string | null) ?? null,
      plan3: (flat.plan3 as string | null) ?? null,
      unreachable: (flat.unreachable as boolean | null) ?? null,
      unreachable2: (flat.unreachable2 as boolean | null) ?? null,
      unreachable3: (flat.unreachable3 as boolean | null) ?? null,
    };
  });

  const stats = computePsychologistProductivity(
    questions,
    adminLookup,
    prefixMap,
    label,
    dateRange
  );

  return NextResponse.json(stats);
}
