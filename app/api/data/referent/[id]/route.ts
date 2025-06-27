import { prisma } from "@/utils/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params).id;
  const data = await prisma.referent.findMany({
    where: {
      id: parseInt(id),
    },
    select: {
      firstname: true,
      lastname: true,
      affiliation: true,
      agency: true,
    },
  });

  return Response.json(data);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;
    const body = await request.json();

    const updated = await prisma.referent.update({
      where: { id: parseInt(id) },
      data: {
        citizenId: body.citizenId,
        prefixId: body.prefixId ? parseInt(body.prefixId) : undefined,
        firstname: body.firstname,
        lastname: body.lastname,
        email: body.email,
        tel: body.tel,
        affiliation_id: body.affiliation_id ? parseInt(body.affiliation_id) : undefined,
        volunteer_type_id: body.volunteer_type_id ? parseInt(body.volunteer_type_id) : undefined,
        employee_type_id: body.employee_type_id ? parseInt(body.employee_type_id) : undefined,
        agency: body.agency,
      },
    });

    return Response.json({ success: true, data: updated });
  } catch (error) {
    return Response.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
