import { prisma } from "@/utils/prisma";

export async function GET() {
  const data = await prisma.province.findMany();

  return Response.json(data);
}
