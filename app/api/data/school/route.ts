import { School } from "@prisma/client";

import { prisma } from "@/utils/prisma";

export async function GET() {
  const data = await prisma.school.findMany({
    where: {
      status: true,
    },
  });

  return Response.json(data);
}

export async function POST(req: Request) {
  const data = await req.json();
  const school: School = data.school_data;

  await prisma.school.upsert({
    where: {
      id: school.id,
    },
    update: {
      name: school.name,
      districtId: parseInt(school.districtId.toString()),
      status: school.status,
      updatedAt: new Date(),
    },
    create: {
      name: school.name,
      districtId: parseInt(school.districtId.toString()),
      status: true,
      createdAt: new Date(),
    },
  });

  return new Response("Success");
}

export async function DELETE() { }
