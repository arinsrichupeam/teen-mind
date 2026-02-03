import lineSdk from "@/utils/linesdk";
import { prisma } from "@/utils/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // read query
  const userId = (await params).id;

  try {
    // ดึง User + Profile ใน query เดียวเพื่อลด round trip (async-parallel / ลด waterfall)
    const profile = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        image: true,
        name: true,
        accounts: {
          select: {
            userId: true,
            provider: true,
            providerAccountId: true,
          },
        },
        profile: {
          select: {
            id: true,
            prefixId: true,
            sex: true,
            firstname: true,
            lastname: true,
            birthday: true,
            ethnicity: true,
            nationality: true,
            hn: true,
            tel: true,
            address: true,
            citizenId: true,
            schoolId: true,
            gradeYear: true,
            school: true,
            emergency: true,
            questions: {
              select: {
                createdAt: true,
                result: true,
                result_text: true,
                phqa: {
                  select: { sum: true },
                },
              },
            },
          },
        },
      },
    });

    const account = profile?.accounts?.[0];

    // อัปเดตชื่อ/รูปจาก LINE (ถ้าเป็นบัญชี LINE) — ต้องรอ lineProfile ก่อน update
    if (account?.provider === "line") {
      const lineProfile = await lineSdk.getProfile(account.providerAccountId);

      await prisma.user.update({
        where: { id: account.userId },
        data: {
          name: lineProfile.displayName ?? null,
          image: lineProfile.pictureUrl ?? null,
        },
      });
      if (profile) {
        profile.name = lineProfile.displayName ?? null;
        profile.image = lineProfile.pictureUrl ?? null;
      }
    }

    if (profile?.profile?.[0]?.citizenId) {
      const referent = await prisma.referent.findFirst({
        where: { citizenId: profile.profile[0].citizenId },
      });

      return Response.json({ ...profile, referent });
    }

    return Response.json(profile);
  } catch (err) {
    return Response.json({
      error: err,
    });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = (await params).id;

  try {
    const body = await req.json();

    await prisma.profile.update({
      where: {
        id: userId,
      },
      data: {
        hn: body.hn,
        citizenId: body.citizenId,
        prefixId: body.prefixId,
        sex: body.sex,
        firstname: body.firstname,
        lastname: body.lastname,
        birthday: body.birthday ? new Date(body.birthday) : undefined,
        ethnicity: body.ethnicity,
        nationality: body.nationality,
        tel: body.tel,
        schoolId: body.schoolId || null,
        gradeYear: body.gradeYear ?? null,
      },
    });

    const profileWithRelations = await prisma.profile.findUnique({
      where: {
        id: userId,
      },
      include: {
        address: true,
        emergency: true,
      },
    });

    if (
      profileWithRelations?.address &&
      profileWithRelations.address.length > 0
    ) {
      await prisma.address.update({
        where: {
          id: profileWithRelations.address[0].id,
        },
        data: {
          houseNo: body.address.houseNo,
          villageNo: body.address.villageNo,
          soi: body.address.soi,
          road: body.address.road,
          subdistrict: body.address.subdistrict,
          district: body.address.district,
          province: body.address.province,
        },
      });
    }

    if (
      profileWithRelations?.emergency &&
      profileWithRelations.emergency.length > 0
    ) {
      await prisma.emergencyContact.update({
        where: {
          id: profileWithRelations.emergency[0].id,
        },
        data: {
          name: body.emergency.name,
          tel: body.emergency.tel,
          relation: body.emergency.relation,
        },
      });
    }

    if (body.hn && body.hn !== "") {
      // อัปเดตเฉพาะ question ที่มี status = 0 ให้เป็น 1 เมื่อมีการอัปเดต HN
      await prisma.questions_Master.updateMany({
        where: {
          profileId: userId,
          status: 0,
        },
        data: {
          status: 1,
        },
      });
    }

    const finalProfile = await prisma.profile.findUnique({
      where: {
        id: userId,
      },
      include: {
        address: true,
        emergency: true,
        school: true,
      },
    });

    return Response.json({
      success: true,
      message: "อัปเดตข้อมูลสำเร็จ",
      data: finalProfile,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: "เกิดข้อผิดพลาดในการอัปเดตข้อมูล",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
