import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import {
  parseDateParam,
  thaiDateRangeToUtc,
} from "@/lib/dashboard/parse-dashboard-date";
import { requireAdmin } from "@/lib/get-session";
import { MapRiskSummary } from "@/types";
import { prisma } from "@/utils/prisma";

const EMPTY_SUMMARY: MapRiskSummary = {
  Green: 0,
  "Green-Low": 0,
  Yellow: 0,
  Orange: 0,
  Red: 0,
};

function toCoordinate(value: unknown): number | null {
  if (value == null) return null;
  const num = Number(value);

  if (!Number.isFinite(num)) return null;

  return num;
}

function hasValidCoordinates(
  latitude: number | null,
  longitude: number | null
) {
  if (latitude == null || longitude == null) return false;
  if (latitude === 0 && longitude === 0) return false;

  return (
    latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180
  );
}

function buildWhereFromQuery(url: URL): Prisma.Questions_MasterWhereInput {
  const conditions: Prisma.Questions_MasterWhereInput[] = [
    { latitude: { not: null } },
    { longitude: { not: null } },
  ];

  const dateFrom = url.searchParams.get("dateFrom");
  const dateTo = url.searchParams.get("dateTo");
  const school = url.searchParams.get("school")?.trim() || "";
  const resultParam = url.searchParams.get("result")?.trim() || "";

  if (dateFrom && dateTo) {
    const parsedFrom = parseDateParam(dateFrom);
    const parsedTo = parseDateParam(dateTo);

    if (parsedFrom && parsedTo) {
      const { startUtc, endUtc } = thaiDateRangeToUtc(parsedFrom, parsedTo);

      conditions.push({
        createdAt: {
          gte: startUtc,
          lt: endUtc,
        },
      });
    }
  }

  if (school) {
    conditions.push({
      profile: {
        school: {
          name: school,
        },
      },
    });
  }

  if (resultParam) {
    const results = resultParam
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (results.length > 0) {
      conditions.push({
        result: {
          in: results,
        },
      });
    }
  }

  return { AND: conditions };
}

function buildSummary(locations: Array<{ result: string }>): MapRiskSummary {
  const summary: MapRiskSummary = { ...EMPTY_SUMMARY };

  for (const location of locations) {
    if (location.result in summary) {
      summary[location.result as keyof MapRiskSummary] += 1;
    }
  }

  return summary;
}

export async function GET(req: Request) {
  const auth = await requireAdmin();

  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const where = buildWhereFromQuery(url);

  const rows = await prisma.questions_Master.findMany({
    where,
    select: {
      id: true,
      latitude: true,
      longitude: true,
      result: true,
      result_text: true,
      status: true,
      createdAt: true,
      profile: {
        select: {
          id: true,
          prefixId: true,
          firstname: true,
          lastname: true,
          school: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const locations = rows
    .map((row) => {
      const latitude = toCoordinate(row.latitude);
      const longitude = toCoordinate(row.longitude);

      if (!hasValidCoordinates(latitude, longitude)) return null;

      return {
        id: row.id,
        latitude: latitude as number,
        longitude: longitude as number,
        result: row.result,
        result_text: row.result_text,
        status: row.status,
        createdAt: row.createdAt.toISOString(),
        profile: {
          id: row.profile.id,
          prefixId: row.profile.prefixId,
          firstname: row.profile.firstname,
          lastname: row.profile.lastname,
          schoolName: row.profile.school?.name ?? null,
        },
      };
    })
    .filter((row): row is NonNullable<typeof row> => row != null);

  return NextResponse.json({
    total: locations.length,
    summary: buildSummary(locations),
    locations,
  });
}
