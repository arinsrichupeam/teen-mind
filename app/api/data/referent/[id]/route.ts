import { prisma } from "@/utils/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params).id;
  const data = await prisma.volunteer.findMany({
    where: {
      id: parseInt(id),
    },
    select: {
      firstName: true,
      lastName: true,
      affiliation: true,
      healthcareFacilityId: true,
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

    const updated = await prisma.volunteer.update({
      where: { id: parseInt(id) },
      data: {
        citizenId: body.citizenId,
        prefixId: body.prefixId ? parseInt(body.prefixId) : undefined,
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        affiliationId: body.affiliation_id
          ? parseInt(body.affiliation_id)
          : body.affiliationId
            ? parseInt(body.affiliationId)
            : undefined,
        volunteerTypeId: body.volunteer_type_id
          ? parseInt(body.volunteer_type_id)
          : body.volunteerTypeId
            ? parseInt(body.volunteerTypeId)
            : undefined,
        employeeTypeId: body.employee_type_id
          ? parseInt(body.employee_type_id)
          : body.employeeTypeId
            ? parseInt(body.employeeTypeId)
            : undefined,
        healthcareFacilityId: body.healthcareFacilityId ?? body.agency,
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
