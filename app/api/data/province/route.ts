import { prisma } from "@/utils/prisma";

export async function GET() {
    const data = await prisma.provinces.findMany();
    return Response.json(data);
};