import { Questions_PHQA } from "@prisma/client";
import { prisma } from '@/utils/prisma';
import lineSdk from "@/utils/linesdk";
import { DemoNoti, GreenFlex, RedFlex, YellowFlex } from "@/config/LineResponse";

export async function GET(req: Request) {
    return Response.json("GET request successful");
}

export async function POST(req: Request) {
    const data = await req.json();
    const userId = data.userId;
    const phqa_data: Questions_PHQA = data.phqa;
    const q2_data: Questions_PHQA = data.q2;

    const phqa_sum = SumValue(phqa_data);

    // console.log(userId);
    // console.log(phqa_data, phqa_sum);
    // console.log(q2_data);
    // console.log("Select ProviderAccountId");
    
    const UUID = await prisma.user.findUnique({
        where: {
            id: userId
        },
        select: {
            accounts: {
                select: {
                    providerAccountId: true
                }
            }
        }
    }).then((val) => val?.accounts[0].providerAccountId as string)

    // console.log("Create Questions");
    await prisma.questions_Master.create({
        data: {
            userId: userId,
            status: 0,
            phqa: {
                create: {
                    q1: phqa_data.q1,
                    q2: phqa_data.q1,
                    q3: phqa_data.q1,
                    q4: phqa_data.q1,
                    q5: phqa_data.q1,
                    q6: phqa_data.q1,
                    q7: phqa_data.q1,
                    q8: phqa_data.q1,
                    q9: phqa_data.q1,
                    sum: phqa_sum
                }
            }
        }
    }).then(async () => {
        switch (true) {
            case (phqa_sum >= 0 && phqa_sum <= 4):
                console.log("Green");
                await lineSdk.pushMessage(UUID, GreenFlex);
                break;
            case (phqa_sum >= 5 && phqa_sum <= 14):
                console.log("Yellow");
                await lineSdk.pushMessage(UUID, YellowFlex);
                break;
            case (phqa_sum >= 15):
                console.log("Red");
                await lineSdk.pushMessage(UUID, RedFlex);
                break;
        }
    });

    return new Response("Success");
}

function SumValue(value: any) {
    const cal = [];
    for (const key in value) {
        if (key.startsWith("q")) {
            const val = Number(`${(value as any)[key]}`);
            cal.push(val);
        }
    }
    const PHQA_SUM = cal.reduce((prev, cur) => {
        return prev + cur
    }, 0);

    return PHQA_SUM;
}