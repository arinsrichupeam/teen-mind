import { prisma } from "@/utils/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {    
    const userId = (await params).id
    console.log(userId);

    const question = await prisma.questions_Master.findMany({
        where: {
            userId: userId
        }

    });

    return Response.json(question);
}