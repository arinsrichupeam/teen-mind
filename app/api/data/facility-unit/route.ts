import { requireAdminOnly } from "@/lib/get-session";
import { prisma } from "@/utils/prisma";

/**
 * GET — list units for a facility.
 * Public (registration forms): active units only.
 * Admin: all units for the facility.
 */
export async function GET(req: Request) {
  const facilityId = new URL(req.url).searchParams.get("healthcareFacilityId");

  if (!facilityId) {
    return Response.json(
      { error: "healthcareFacilityId is required" },
      { status: 400 }
    );
  }

  const auth = await requireAdminOnly();
  const data = await prisma.facilityUnit.findMany({
    where: {
      healthcareFacilityId: facilityId,
      ...(auth ? {} : { status: true }),
    },
    orderBy: { name: "asc" },
  });

  return Response.json(data);
}

export async function POST(req: Request) {
  const auth = await requireAdminOnly();

  if (!auth) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as {
    name?: string;
    healthcareFacilityId?: string;
    status?: boolean;
  };
  const name = body.name?.trim();

  if (!name || !body.healthcareFacilityId) {
    return Response.json(
      { error: "name and healthcareFacilityId are required" },
      { status: 400 }
    );
  }

  const created = await prisma.facilityUnit.create({
    data: {
      name,
      healthcareFacilityId: body.healthcareFacilityId,
      status: body.status ?? true,
    },
  });

  return Response.json({ success: true, data: created });
}

export async function PATCH(req: Request) {
  const auth = await requireAdminOnly();

  if (!auth) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as {
    id?: number;
    name?: string;
    status?: boolean;
  };

  if (!body.id) {
    return Response.json({ error: "id is required" }, { status: 400 });
  }

  const updated = await prisma.facilityUnit.update({
    where: { id: body.id },
    data: {
      ...(body.name != null ? { name: body.name.trim() } : {}),
      ...(body.status != null ? { status: body.status } : {}),
    },
  });

  return Response.json({ success: true, data: updated });
}
