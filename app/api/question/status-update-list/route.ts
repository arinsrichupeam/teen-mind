import { ScreeningResult } from "@prisma/client";

import { mapLegacyRiskColorToScreeningResult } from "@/lib/legacy-value-mapping";
import { OPEN_CASE_STATUSES } from "@/lib/case-status-mapping";
import { toLegacyQuestionList } from "@/lib/case-to-legacy-question";
import { requireAdmin } from "@/lib/get-session";
import { prisma } from "@/utils/prisma";

const PAGE_SIZE = 100;

function mapResultFilter(resultParam: string): ScreeningResult[] {
  if (!resultParam) {
    return [ScreeningResult.NEGATIVE, ScreeningResult.POSITIVE_LOW];
  }

  return resultParam
    .split(",")
    .map((r) => r.trim())
    .filter(Boolean)
    .map((r) => mapLegacyRiskColorToScreeningResult(r));
}

export async function GET(req: Request) {
  const auth = await requireAdmin();

  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const school = url.searchParams.get("school")?.trim() || "";
  const q2Risk = url.searchParams.get("q2Risk")?.trim() || "";
  const q8Risk = url.searchParams.get("q8Risk")?.trim() || "";
  const resultParam = url.searchParams.get("result")?.trim() || "";
  const pageParam = url.searchParams.get("page");
  const page = Math.max(Number(pageParam) || 1, 1);
  const resultValues = mapResultFilter(resultParam);

  const whereConditions: Record<string, unknown>[] = [
    { status: { in: OPEN_CASE_STATUSES } },
    {
      OR: [
        {
          AND: [
            { questions9Q: { some: {} } },
            {
              result: resultParam
                ? mapLegacyRiskColorToScreeningResult(resultParam)
                : ScreeningResult.NEGATIVE,
            },
          ],
        },
        {
          AND: [
            { NOT: { questions9Q: { some: {} } } },
            { result: { in: resultValues } },
          ],
        },
      ],
    },
  ];

  if (school) {
    whereConditions.push({ profile: { school: { name: school } } });
  }

  if (q2Risk === "risk") {
    whereConditions.push({
      questions2Q: { some: { OR: [{ q1: 1 }, { q2: 1 }] } },
    });
  } else if (q2Risk === "no-risk") {
    whereConditions.push({
      NOT: { questions2Q: { some: { OR: [{ q1: 1 }, { q2: 1 }] } } },
    });
  }

  if (q8Risk === "risk") {
    whereConditions.push({ questions8Q: { some: { sum: { gt: 0 } } } });
  } else if (q8Risk === "no-risk") {
    whereConditions.push({
      NOT: { questions8Q: { some: { sum: { gt: 0 } } } },
    });
  }

  const where = { AND: whereConditions };

  const [total, data] = await prisma.$transaction([
    prisma.case.count({ where }),
    prisma.case.findMany({
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      where,
      select: {
        id: true,
        result: true,
        status: true,
        treatmentNotes: true,
        profile: {
          select: {
            prefixId: true,
            firstName: true,
            lastName: true,
            hn: true,
            school: { select: { name: true } },
          },
        },
        questions2Q: { select: { q1: true, q2: true } },
        questions8Q: { select: { sum: true } },
        questions9Q: { select: { sum: true } },
        questionsPhqa: { select: { sum: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return Response.json({
    questionsList: toLegacyQuestionList(data),
    pagination: {
      page,
      limit: PAGE_SIZE,
      total,
      totalPages: Math.ceil(total / PAGE_SIZE),
    },
  });
}
