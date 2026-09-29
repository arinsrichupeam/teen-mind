import { requireAdminOnly } from "@/lib/get-session";
import { prisma } from "@/utils/prisma";

/** GET — public active list (LIFF) or all when `?all=1` + Admin. */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all") === "1";

  if (all) {
    const auth = await requireAdminOnly();

    if (!auth) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const data = await prisma.affiliation.findMany({
    where: all ? undefined : { status: true },
    include: { _count: { select: { facilities: true } } },
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
    return Response.json({ error: "ต้องระบุชื่อสังกัด" }, { status: 400 });
  }

  const created = await prisma.affiliation.create({
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
  };

  if (!body.id) {
    return Response.json({ error: "id is required" }, { status: 400 });
  }

  const updated = await prisma.affiliation.update({
    where: { id: body.id },
    data: {
      ...(body.name != null ? { name: body.name.trim() } : {}),
      ...(body.status != null ? { status: body.status } : {}),
    },
  });

  return Response.json({ success: true, data: updated });
}
