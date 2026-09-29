import { FacilityStatus } from "@prisma/client";

import { requireAdminOnly } from "@/lib/get-session";
import { prisma } from "@/utils/prisma";

/** GET — active list for LIFF; Admin can filter by affiliationId / zoneId / all. */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const affiliationIdParam = searchParams.get("affiliationId");
  const zoneIdParam = searchParams.get("zoneId");
  const unassigned = searchParams.get("unassigned") === "1";
  const all = searchParams.get("all") === "1";

  if (affiliationIdParam || zoneIdParam || unassigned || all) {
    const auth = await requireAdminOnly();

    if (!auth) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const affiliationId = affiliationIdParam
      ? parseInt(affiliationIdParam, 10)
      : undefined;
    const zoneId = zoneIdParam ? parseInt(zoneIdParam, 10) : undefined;

    const data = await prisma.healthcareFacility.findMany({
      where: {
        ...(affiliationId && !Number.isNaN(affiliationId)
          ? { affiliationId }
          : {}),
        ...(unassigned ? { zoneId: null } : {}),
        ...(zoneId != null && !Number.isNaN(zoneId) && !unassigned
          ? { zoneId }
          : {}),
      },
      include: {
        _count: { select: { units: true } },
        affiliation: { select: { id: true, name: true } },
        zone: {
          select: { id: true, name: true, facilitatorFacilityId: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return Response.json(
      data.map((f) => ({
        ...f,
        zoneFacilitator: f.zone?.facilitatorFacilityId === f.id,
      }))
    );
  }

  const data = await prisma.healthcareFacility.findMany({
    where: { status: FacilityStatus.ACTIVE },
    select: {
      id: true,
      name: true,
      affiliationId: true,
      provinceId: true,
      districtId: true,
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
    affiliationId?: number;
    zoneId?: number | null;
    status?: FacilityStatus;
    provinceId?: number;
    districtId?: number;
    subdistrictId?: number;
  };

  const name = body.name?.trim();

  if (!name) {
    return Response.json({ error: "ต้องระบุชื่อหน่วยงาน" }, { status: 400 });
  }
  if (!body.affiliationId) {
    return Response.json({ error: "ต้องระบุสังกัด" }, { status: 400 });
  }

  let provinceId = body.provinceId;
  let districtId = body.districtId;
  let subdistrictId = body.subdistrictId;

  if (provinceId == null || districtId == null || subdistrictId == null) {
    const geo = await prisma.district.findFirst({
      include: { subdistricts: { take: 1, orderBy: { id: "asc" } } },
    });

    if (!geo?.subdistricts[0]) {
      return Response.json(
        { error: "ยังไม่มีข้อมูลเขต/แขวงในระบบ" },
        { status: 400 }
      );
    }
    provinceId = geo.provinceId;
    districtId = geo.id;
    subdistrictId = geo.subdistricts[0].id;
  }

  const created = await prisma.healthcareFacility.create({
    data: {
      name,
      affiliationId: body.affiliationId,
      zoneId: body.zoneId ?? null,
      provinceId,
      districtId,
      subdistrictId,
      status: body.status ?? FacilityStatus.ACTIVE,
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
    id?: string;
    name?: string;
    affiliationId?: number;
    zoneId?: number | null;
    status?: FacilityStatus;
    zoneFacilitator?: boolean;
  };

  if (!body.id) {
    return Response.json({ error: "id is required" }, { status: 400 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const facility = await tx.healthcareFacility.update({
      where: { id: body.id },
      data: {
        ...(body.name != null ? { name: body.name.trim() } : {}),
        ...(body.affiliationId != null
          ? { affiliationId: body.affiliationId }
          : {}),
        ...(body.zoneId !== undefined ? { zoneId: body.zoneId } : {}),
        ...(body.status != null ? { status: body.status } : {}),
      },
    });

    if (body.zoneFacilitator === true && facility.zoneId != null) {
      await tx.zone.update({
        where: { id: facility.zoneId },
        data: { facilitatorFacilityId: facility.id },
      });
    }
    if (body.zoneFacilitator === false && facility.zoneId != null) {
      const zone = await tx.zone.findUnique({
        where: { id: facility.zoneId },
        select: { facilitatorFacilityId: true },
      });

      if (zone?.facilitatorFacilityId === facility.id) {
        await tx.zone.update({
          where: { id: facility.zoneId },
          data: { facilitatorFacilityId: null },
        });
      }
    }

    return facility;
  });

  return Response.json({ success: true, data: updated });
}
