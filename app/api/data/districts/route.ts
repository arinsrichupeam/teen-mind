import { prisma } from "@/utils/prisma";

export async function GET() {
  const data = await prisma.district.findMany();

  return Response.json(data);
}
