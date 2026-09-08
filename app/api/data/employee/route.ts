import { prisma } from "@/utils/prisma";

export async function GET() {
  const data = await prisma.employeeType.findMany({
    where: {
      status: true,
    },
  });

  return Response.json(data);
}
