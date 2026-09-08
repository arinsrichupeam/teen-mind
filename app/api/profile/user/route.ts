import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/get-session";
import { mapLegacySexToSex } from "@/lib/legacy-value-mapping";
import { prisma } from "@/utils/prisma";
import { validateBirthdayValue } from "@/utils/helper";

export async function GET() {
  const auth = await requireAdmin();

  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.profile.findMany({
    select: {
      id: true,
      userId: true,
      firstName: true,
      lastName: true,
      prefixId: true,
      sex: true,
      birthDate: true,
      ethnicity: true,
      nationality: true,
      hn: true,
      citizenId: true,
      phone: true,
      school: true,
      gradeYear: true,
      cases: {
        select: {
          id: true,
          createdAt: true,
          result: true,
          questions2Q: {
            select: {
              q1: true,
              q2: true,
            },
          },
          questionsPhqa: {
            select: {
              sum: true,
            },
          },
          questionsPhqaAddon: {
            select: {
              q1: true,
              q2: true,
            },
          },
          questions9Q: {
            select: {
              sum: true,
            },
          },
          questions8Q: {
            select: {
              sum: true,
            },
          },
          volunteer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              affiliation: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      addresses: true,
      emergencyContacts: true,
      user: {
        select: {
          name: true,
          image: true,
          accounts: {
            where: { provider: "line" },
            select: {
              providerAccountId: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const auth = await requireAdmin();

  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();

    const birthdayValidationError = validateBirthdayValue(data.birthDate);

    if (birthdayValidationError) {
      return NextResponse.json(
        { error: birthdayValidationError },
        { status: 400 }
      );
    }

    const newProfile = await prisma.profile.create({
      data: {
        hn: data.hn || "",
        citizenId: data.citizenId,
        prefixId: data.prefixId,
        sex: mapLegacySexToSex(data.sex),
        firstName: data.firstName,
        lastName: data.lastName,
        birthDate: data.birthDate,
        ethnicity: data.ethnicity,
        nationality: data.nationality,
        phone: data.phone,
        schoolId: data.schoolId || null,
        addresses: {
          create: {
            houseNo: data.addresses.houseNo,
            villageNo: data.addresses.villageNo,
            soi: data.addresses.soi,
            road: data.addresses.road,
            subdistrictId: data.addresses.subdistrictId,
            districtId: data.addresses.districtId,
            provinceId: data.addresses.provinceId,
          },
        },
        emergencyContacts: {
          create: {
            name: data.emergencyContacts.name,
            phone: data.emergencyContacts.phone,
            relation: data.emergencyContacts.relation,
          },
        },
      },
      include: {
        school: true,
        addresses: true,
        emergencyContacts: true,
      },
    });

    return NextResponse.json(newProfile);
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const auth = await requireAdmin();

  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();

    if (data.hn !== "") {
      await prisma.profile.update({
        where: {
          id: data.id,
        },
        data: {
          hn: data.hn,
        },
      });

      // อัปเดตเฉพาะ question ที่มี status = 0 ให้เป็น 1 เมื่อมีการอัปเดต HN
      // HN is on Profile; CaseStatus no longer tracks "awaiting HN" (legacy 0→1).
    }

    return new Response("Success");
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 500 });
  }
}
