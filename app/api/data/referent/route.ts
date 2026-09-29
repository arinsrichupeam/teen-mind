import { prisma } from "@/utils/prisma";

export async function GET() {
  const data = await prisma.volunteer.findMany({
    where: {
      status: true,
    },
  });

  return Response.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { citizenId, tel } = body;

  const data = await prisma.volunteer.findMany({
    where: {
      citizenId: citizenId,
      phone: tel,
      status: true, // ไม่ให้ login ถ้าปิดการใช้งานแล้ว
    },
    select: {
      id: true,
      citizenId: true,
      prefixId: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      affiliationId: true,
      affiliation: true,
      volunteerTypeId: true,
      volunteerType: true,
      employeeTypeId: true,
      employeeType: true,
      healthcareFacilityId: true,
      facilityUnitId: true,
      healthcareFacility: { select: { id: true, name: true } },
      facilityUnit: { select: { id: true, name: true } },
    },
  });

  const formattedData = data.map((referent) => ({
    ...referent,
    id: referent.id,
  }));

  return Response.json(formattedData);
}
