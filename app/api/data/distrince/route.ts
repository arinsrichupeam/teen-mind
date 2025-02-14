import { prisma } from "@/utils/prisma";

export async function GET() {
  const data = await prisma.districts.findMany();

  return Response.json(data);
}
