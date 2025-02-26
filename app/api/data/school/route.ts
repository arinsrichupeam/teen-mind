import { now } from "moment";
import { School } from "@prisma/client";

import { prisma } from "@/utils/prisma";

export async function GET() {
  const data = await prisma.school.findMany();

  return Response.json(data);
}

export async function POST(req: Request) {
  const data: School = await req.json();

  await prisma.school.upsert({
    where: {
      id: data.id,
    },
    create: {
      name: data.name,
      districtId: data.districtId,
      status: 1,
      createdAt: now().toString(),
    },
    update: {
      name: data.name,
      districtId: data.districtId,
      status: data.status,
    },
  });

  return new Response("Success");
}
