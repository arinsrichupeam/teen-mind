import { Questions_2Q, Questions_PHQA } from "@prisma/client";
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
    const q2_data: Questions_2Q = data.q2;
    let status = "";

    const phqa_sum = SumValue(phqa_data);

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

    switch (true) {
        case (phqa_sum >= 0 && phqa_sum <= 4):
            status = "Green";
            break;
        case (phqa_sum >= 5 && phqa_sum <= 14):
            status = "Yellow";
            break;
        case (phqa_sum >= 15):
            status = "Red";
            break;
    }

    console.log("Create Questions");
    await prisma.questions_Master.create({
        data: {
            userId: userId,
            result: status,
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
            },
            q2: {
                create: {
                    q1: q2_data.q1,
                    q2: q2_data.q2
                }
            }
        }
    }).then(async () => {
        switch (status) {
            case "Green":
                await lineSdk.pushMessage(UUID, GreenFlex);
                break;
            case "Yellow":
                await lineSdk.pushMessage(UUID, YellowFlex);
                break;
            case "Red":
                await lineSdk.pushMessage(UUID, RedFlex);
                break;
        }
    });

    return Response.json(status);
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