import { prisma } from "@/utils/prisma";

export async function GET() {
  const data = await prisma.profile_Admin.findMany({
    select: {
      id: true,
      userId: true,
      prefixId: true,
      firstname: true,
      lastname: true,
      professional: true,
      affiliationId: true,
      agency: true,
      role: true,
      status: true,
    },
  });

  return Response.json(data);
}
