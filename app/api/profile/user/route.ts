import { NextResponse } from "next/server";

import { prisma } from "@/utils/prisma";

// Create new Profile
export async function POST(req: Request) {
  try {
    const data = await req.json();

    // สร้าง profile ใหม่
    const newProfile = await prisma.profile.create({
      data: {
        hn: data.hn || "",
        citizenId: data.citizenId,
        prefixId: data.prefixId,
        sex: parseInt(data.sex) || 1,
        firstname: data.firstname,
        lastname: data.lastname,
        birthday: data.birthday,
        ethnicity: data.ethnicity,
        nationality: data.nationality,
        tel: data.tel,
        schoolId: data.schoolId || null,
        address: {
          create: {
            houseNo: data.address.houseNo,
            villageNo: data.address.villageNo,
            soi: data.address.soi,
            road: data.address.road,
            subdistrict: data.address.subdistrict,
            district: data.address.district,
            province: data.address.province,
          },
        },
        emergency: {
          create: {
            name: data.emergency.name,
            tel: data.emergency.tel,
            relation: data.emergency.relation,
          },
        },
      },
      include: {
        school: true,
        address: true,
        emergency: true,
      },
    });

    return NextResponse.json(newProfile);
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 500 });
  }
}

// Update Profile -> HN -> Update Question Status
export async function PATCH(req: Request) {
  const data = await req.json();

  if (data.hn !== "") {
    const profile = await prisma.profile
      .update({
        where: {
          id: data.id,
        },
        data: {
          hn: data.hn,
        },
        select: {
          id: true,
          userId: true,
        },
      })
      .then((val) => {
        return val;
      });

    await prisma.questions_Master.updateMany({
      where: {
        profileId: profile.id,
        status: 0,
      },
      data: {
        status: 1,
      },
    });
  }

  return new Response("Success");
}

export async function GET() {
  const users = await prisma.profile.findMany({
    select: {
      id: true,
      firstname: true,
      lastname: true,
      prefixId: true,
      sex: true,
      citizenId: true,
      tel: true,
      school: true,
      questions: {
        select: {
          id: true,
          createdAt: true,
          result: true,
          result_text: true,
          referent: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
              affiliation: {
                select: {
                  name: true,
                },
              },
              agency: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      address: true,
      emergency: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(users);
}
