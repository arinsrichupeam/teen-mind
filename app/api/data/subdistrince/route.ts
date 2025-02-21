import { prisma } from "@/utils/prisma";

export async function GET() {
  const data = await prisma.subdistricts.findMany();

  return Response.json(data);
}
