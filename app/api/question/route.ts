import { Questions_PHQA, Questions_PHQA_Addon } from "@prisma/client";

import { prisma } from "@/utils/prisma";
import lineSdk from "@/utils/linesdk";
import { GreenFlex, RedFlex, YellowFlex } from "@/config/site";
import { LocationData } from "@/types";

export async function GET() {
  const questionsList = await prisma.questions_Master.findMany({
    select: {
      id: true,
      createdAt: true,
      result: true,
      status: true,
      consult: true,
      User: {
        select: {
          image: true,
          profile: {
            select: {
              prefix: true,
              firstname: true,
              lastname: true,
              birthday: true,
              school: true,
            },
          },
        },
      },
      phqa: {
        select: {
          sum: true,
        },
      },
    },
  });

  return Response.json({ questionsList });
}

export async function POST(req: Request) {
  const data = await req.json();

  const userId = data.userId;
  const referenceId = data.reference;
  const phqa_data: Questions_PHQA = data.phqa;
  const phqa_addon: Questions_PHQA_Addon = data.phqa_addon;
  const location_data: LocationData = data.location;
  let status = "";

  const phqa_sum = SumValue(phqa_data);

  const UUID = await prisma.user
    .findUnique({
      where: {
        id: userId,
      },
      select: {
        accounts: {
          select: {
            providerAccountId: true,
          },
        },
      },
    })
    .then((val) => val?.accounts[0].providerAccountId as string);

  if (phqa_sum > 14) {
    status = "Red";
  } else if (phqa_sum > 4) {
    status = "Yellow";
  } else {
    if (phqa_data.q9 > 0 || phqa_addon.q1 == 1 || phqa_addon.q2 == 1) {
      status = "Yellow";
    } else {
      status = "Green";
    }
  }

  await prisma.questions_Master
    .create({
      data: {
        latitude: location_data.latitude,
        userId: userId,
        longitude: location_data.longitude,
        referent: referenceId,
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
            sum: phqa_sum,
          },
        },
        addon: {
          create: {
            q1: phqa_addon.q1,
            q2: phqa_addon.q2,
          },
        },
      },
    })
    .then(async () => {
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
    return prev + cur;
  }, 0);

  return PHQA_SUM;
}
