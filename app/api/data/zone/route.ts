import { requireAdminOnly } from "@/lib/get-session";
import { prisma } from "@/utils/prisma";

export async function GET() {
  const auth = await requireAdminOnly();

  if (!auth) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = await prisma.zone.findMany({
    include: {
      _count: { select: { facilities: true } },
      facilitatorFacility: { select: { id: true, name: true } },
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

  const body = (await req.json()) as { name?: string; status?: boolean };
  const name = body.name?.trim();

  if (!name) {
    return Response.json({ error: "ต้องระบุชื่อ Zone" }, { status: 400 });
  }

  const created = await prisma.zone.create({
    data: { name, status: body.status ?? true },
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
    facilitatorFacilityId?: string | null;
  };

  if (!body.id) {
    return Response.json({ error: "id is required" }, { status: 400 });
  }

  const updated = await prisma.zone.update({
    where: { id: body.id },
    data: {
      ...(body.name != null ? { name: body.name.trim() } : {}),
      ...(body.status != null ? { status: body.status } : {}),
      ...(body.facilitatorFacilityId !== undefined
        ? { facilitatorFacilityId: body.facilitatorFacilityId }
        : {}),
    },
  });

  return Response.json({ success: true, data: updated });
}
