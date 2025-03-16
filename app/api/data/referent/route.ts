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
      firstname: true,
      lastname: true,
      affiliation: true,
      agency: true,
      volunteer_type: true,
    },
  });

  const formattedData = data.map((referent) => ({
    ...referent,
    id: referent.id.toString().padStart(3, '0'),
  }));

  console.log(formattedData);

  return Response.json(formattedData);
}