import { requireAdminOnly } from "@/lib/get-session";
import { resolveFacilityUnitId } from "@/lib/resolve-facility-unit";
import { prisma } from "@/utils/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params).id;
  const data = await prisma.volunteer.findMany({
    where: {
      id: parseInt(id, 10),
      status: true, // ไม่คืนอาสาสมัครที่ปิดการใช้งานแล้ว
    },
    select: {
      firstName: true,
      lastName: true,
      affiliation: { select: { id: true, name: true } },
      healthcareFacility: {
        select: {
          id: true,
          name: true,
        },
      },
      facilityUnit: { select: { id: true, name: true } },
    },
  });

  return Response.json(data);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    const body = await request.json();

    const healthcareFacilityId = String(
      body.healthcareFacilityId ?? body.agency ?? ""
    ).trim();

    if (!healthcareFacilityId) {
      return Response.json({ error: "กรุณาเลือกหน่วยงาน" }, { status: 400 });
    }

    const unitResult = await resolveFacilityUnitId({
      healthcareFacilityId,
      facilityUnitId: body.facilityUnitId,
      newFacilityUnitName: body.newFacilityUnitName,
    });

    if ("error" in unitResult) {
      return Response.json({ error: unitResult.error }, { status: 400 });
    }

    const updated = await prisma.volunteer.update({
      where: { id: parseInt(id, 10) },
      data: {
        citizenId: body.citizenId,
        prefixId: body.prefixId
          ? parseInt(String(body.prefixId), 10)
          : undefined,
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        affiliationId: body.affiliation_id
          ? parseInt(String(body.affiliation_id), 10)
          : body.affiliationId
            ? parseInt(String(body.affiliationId), 10)
            : undefined,
        volunteerTypeId: body.volunteer_type_id
          ? parseInt(String(body.volunteer_type_id), 10)
          : body.volunteerTypeId
            ? parseInt(String(body.volunteerTypeId), 10)
            : undefined,
        employeeTypeId: body.employee_type_id
          ? parseInt(String(body.employee_type_id), 10)
          : body.employeeTypeId
            ? parseInt(String(body.employeeTypeId), 10)
            : undefined,
        healthcareFacilityId,
        facilityUnitId: unitResult.id,
        status:
          typeof body.status === "boolean"
            ? body.status
            : body.status === "true" || body.status === 1 || body.status === "1"
              ? true
              : body.status === "false" ||
                  body.status === 0 ||
                  body.status === "0"
                ? false
                : undefined,
      },
    });

    return Response.json({ success: true, data: updated });
  } catch (error) {
    return Response.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminOnly();

  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const id = (await params).id;
    const updated = await prisma.volunteer.update({
      where: { id: parseInt(id, 10) },
      data: { status: false },
    });

    return Response.json({ success: true, data: updated });
  } catch (error) {
    return Response.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
