import { type NextRequest, NextResponse } from "next/server";

import {
  parseDateParam,
  thaiDateRangeToUtc,
} from "@/lib/dashboard/parse-dashboard-date";
import { requireAdmin } from "@/lib/get-session";
import { prisma } from "@/utils/prisma";

const PROBLEM_FIELDS = [
  { key: "familyRelation", label: "ความสัมพันธ์ในครอบครัว", group: "ครอบครัว" },
  {
    key: "familyStudyPressure",
    label: "แรงกดดันด้านการเรียน (ครอบครัว)",
    group: "ครอบครัว",
  },
  {
    key: "familyConflict",
    label: "ความขัดแย้งในครอบครัว",
    group: "ครอบครัว",
  },
  {
    key: "familyAbuse",
    label: "การถูกทำร้ายในครอบครัว",
    group: "ครอบครัว",
  },
  {
    key: "familyLoss",
    label: "การสูญเสียสมาชิกครอบครัว",
    group: "ครอบครัว",
  },
  {
    key: "socialFriendIssue",
    label: "ปัญหาความสัมพันธ์กับเพื่อน",
    group: "สังคม",
  },
  { key: "socialBullying", label: "การถูกรังแก (Bullying)", group: "สังคม" },
  { key: "socialBreakup", label: "ปัญหาความรัก/การเลิกรา", group: "สังคม" },
  { key: "socialTeacher", label: "ปัญหากับครู/อาจารย์", group: "สังคม" },
  {
    key: "socialAssault",
    label: "การถูกทำร้าย/ล่วงละเมิด",
    group: "สังคม",
  },
  { key: "studyStress", label: "ความเครียดด้านการเรียน", group: "การเรียน" },
  {
    key: "studyNoMotivation",
    label: "ขาดแรงจูงใจในการเรียน",
    group: "การเรียน",
  },
  {
    key: "studyBurnout",
    label: "หมดไฟในการเรียน (Burnout)",
    group: "การเรียน",
  },
  {
    key: "studyTimeManage",
    label: "บริหารเวลาในการเรียน",
    group: "การเรียน",
  },
  { key: "studyHomeworkLoad", label: "ภาระการบ้าน/งานมาก", group: "การเรียน" },
  {
    key: "studyExamAnxiety",
    label: "วิตกกังวลเรื่องการสอบ",
    group: "การเรียน",
  },
  {
    key: "financeFamilyIssue",
    label: "ปัญหาการเงินในครอบครัว",
    group: "การเงิน",
  },
  {
    key: "lifestyleSocialMediaOveruse",
    label: "ใช้โซเชียลมีเดียมากเกิน",
    group: "พฤติกรรม",
  },
  { key: "lifestyleGamingAddiction", label: "ติดเกม", group: "พฤติกรรม" },
  { key: "lifestyleSubstanceUse", label: "การใช้สารเสพติด", group: "พฤติกรรม" },
  {
    key: "lifestyleEatingIssue",
    label: "ปัญหาด้านการกิน",
    group: "พฤติกรรม",
  },
  {
    key: "lifestyleBodyImageConcern",
    label: "กังวลรูปร่างหน้าตา",
    group: "พฤติกรรม",
  },
  {
    key: "lifestyleInsomnia",
    label: "นอนหลับยาก (Insomnia)",
    group: "พฤติกรรม",
  },
] as const;

export type ProblemStat = {
  key: string;
  label: string;
  group: string;
  count: number;
};

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();

  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const dateFromParam = searchParams.get("dateFrom");
  const dateToParam = searchParams.get("dateTo");

  let createdAtFilter: { gte: Date; lt: Date } | undefined;

  if (dateFromParam && dateToParam) {
    const parsedFrom = parseDateParam(dateFromParam);
    const parsedTo = parseDateParam(dateToParam);

    if (parsedFrom && parsedTo) {
      const { startUtc, endUtc } = thaiDateRangeToUtc(parsedFrom, parsedTo);

      createdAtFilter = { gte: startUtc, lt: endUtc };
    }
  }

  const agg = await prisma.questions_Problem.aggregate({
    _sum: {
      familyRelation: true,
      familyStudyPressure: true,
      familyConflict: true,
      familyAbuse: true,
      familyLoss: true,
      socialFriendIssue: true,
      socialBullying: true,
      socialBreakup: true,
      socialTeacher: true,
      socialAssault: true,
      studyStress: true,
      studyNoMotivation: true,
      studyBurnout: true,
      studyTimeManage: true,
      studyHomeworkLoad: true,
      studyExamAnxiety: true,
      financeFamilyIssue: true,
      lifestyleSocialMediaOveruse: true,
      lifestyleGamingAddiction: true,
      lifestyleSubstanceUse: true,
      lifestyleEatingIssue: true,
      lifestyleBodyImageConcern: true,
      lifestyleInsomnia: true,
    },
    where: createdAtFilter
      ? { Questions_Master: { createdAt: createdAtFilter } }
      : undefined,
  });

  const sums = agg._sum;

  const problems: ProblemStat[] = PROBLEM_FIELDS.map((f) => ({
    key: f.key,
    label: f.label,
    group: f.group,
    count: (sums[f.key as keyof typeof sums] as number | null) ?? 0,
  })).sort((a, b) => b.count - a.count);

  return NextResponse.json({ problems });
}
