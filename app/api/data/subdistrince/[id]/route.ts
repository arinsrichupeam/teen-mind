import { prisma } from "@/utils/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const id = (await params).id

    const data = await prisma.subdistricts.findMany({
        where: {
            districtId: parseInt(id)
        }
    });

    return Response.json(data);
};