import { requireAdmin } from "@/lib/get-session";
import { prisma } from "@/utils/prisma";

const PAGE_SIZE = 100;

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

  const whereConditions: Record<string, unknown>[] = [
    { status: { in: [0, 1, 2] } },
    {
      OR: [
        {
          AND: [
            { q9: { some: {} } },
            { result: resultParam ? resultParam : "Green" },
          ],
        },
        {
          AND: [
            { NOT: { q9: { some: {} } } },
            {
              result: {
                in: resultParam
                  ? resultParam.split(",").map((r) => r.trim())
                  : ["Green", "Green-Low"],
              },
            },
          ],
        },
      ],
    },
  ];

  if (school) {
    whereConditions.push({ profile: { school: { name: school } } });
  }

  if (q2Risk === "risk") {
    whereConditions.push({ q2: { some: { OR: [{ q1: 1 }, { q2: 1 }] } } });
  } else if (q2Risk === "no-risk") {
    whereConditions.push({
      NOT: { q2: { some: { OR: [{ q1: 1 }, { q2: 1 }] } } },
    });
  }

  if (q8Risk === "risk") {
    whereConditions.push({ q8: { some: { sum: { gt: 0 } } } });
  } else if (q8Risk === "no-risk") {
    whereConditions.push({ NOT: { q8: { some: { sum: { gt: 0 } } } } });
  }

  const where = { AND: whereConditions };

  const [total, data] = await prisma.$transaction([
    prisma.questions_Master.count({ where }),
    prisma.questions_Master.findMany({
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      where,
      select: {
        id: true,
        result: true,
        status: true,
        profile: {
          select: {
            prefixId: true,
            firstname: true,
            lastname: true,
            school: { select: { name: true } },
          },
        },
        q2: { select: { q1: true, q2: true } },
        q8: { select: { sum: true } },
        q9: { select: { sum: true } },
        phqa: { select: { sum: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return Response.json({
    questionsList: data,
    pagination: {
      page,
      limit: PAGE_SIZE,
      total,
      totalPages: Math.ceil(total / PAGE_SIZE),
    },
  });
}
