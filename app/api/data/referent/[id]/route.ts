import { prisma } from "@/utils/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params).id;
  const data = await prisma.referent.findMany({
    where: {
      id: parseInt(id),
    },
    select: {
      firstname: true,
      lastname: true,
      affiliation: true,
      agency: true,
    },
  });

  return Response.json(data);
}
