import { School } from "@prisma/client";

import { prisma } from "@/utils/prisma";

export type SchoolScreeningInput = {
  round: number;
  startDate: string | Date;
  endDate?: string | Date | null;
};

type SchoolPayload = School & {
  screenings?: SchoolScreeningInput[];
};

function normalizeScreenings(
  screenings: SchoolScreeningInput[] | undefined
): { round: number; startDate: Date; endDate: Date | null }[] {
  if (!Array.isArray(screenings)) return [];

  return screenings
    .filter((s) => s?.startDate != null && Number(s.round) > 0)
    .map((s) => {
      const startDate = new Date(s.startDate);
      const endDate =
        s.endDate != null && String(s.endDate) !== ""
          ? new Date(s.endDate)
          : startDate;

      return {
        round: Number(s.round),
        startDate,
        endDate,
      };
    })
    .filter((s) => !Number.isNaN(s.startDate.getTime()));
}

export async function GET() {
  const data = await prisma.school.findMany({
    where: {
      status: true,
    },
    include: {
      screenings: {
        orderBy: { round: "asc" },
      },
    },
  });

  return Response.json(data);
}

export async function POST(req: Request) {
  const data = await req.json();
  const school: SchoolPayload = data.school_data;
  const screenings = normalizeScreenings(school.screenings);
  const round1 = screenings.find((s) => s.round === 1);
  const screeningDate =
    round1?.startDate ??
    (school.screeningDate ? new Date(school.screeningDate) : null);

  const saved = await prisma.$transaction(async (tx) => {
    const upserted = await tx.school.upsert({
      where: {
        id: school.id,
      },
      update: {
        name: school.name,
        districtId: parseInt(school.districtId.toString()),
        status: school.status,
        screeningDate,
        updatedAt: new Date(),
      },
      create: {
        name: school.name,
        districtId: parseInt(school.districtId.toString()),
        status: true,
        screeningDate,
        createdAt: new Date(),
      },
    });

    await tx.school_Screening.deleteMany({
      where: { schoolId: upserted.id },
    });

    if (screenings.length > 0) {
      await tx.school_Screening.createMany({
        data: screenings.map((s) => ({
          schoolId: upserted.id,
          round: s.round,
          startDate: s.startDate,
          endDate: s.endDate,
        })),
      });
    }

    return upserted;
  });

  return Response.json({ success: true, data: saved });
}

export async function DELETE() {}
