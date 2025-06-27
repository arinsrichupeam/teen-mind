import { prisma } from "@/utils/prisma";

export async function GET() {
  const data = await prisma.referent.findMany({
    where: {
      status: true,
    },
  });

  return Response.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { citizenId, tel } = body;

  const data = await prisma.referent.findMany({
    where: {
      citizenId: citizenId,
      tel: tel,
    },
    select: {
      id: true,
      citizenId: true,
      prefixId: true,
      firstname: true,
      lastname: true,
      email: true,
      tel: true,
      affiliation_id: true,
      affiliation: true,
      volunteer_type_id: true,
      volunteer_type: true,
      employee_type_id: true,
      employee_type: true,
      agency: true,
    },
  });

  const formattedData = data.map((referent) => ({
    ...referent,
    id: referent.id,
  }));

  return Response.json(formattedData);
}
