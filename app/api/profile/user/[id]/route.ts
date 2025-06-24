import lineSdk from "@/utils/linesdk";
import { prisma } from "@/utils/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // read query
  const userId = (await params).id;

  try {
    // Get User From DB
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        accounts: {
          select: {
            userId: true,
            provider: true,
            providerAccountId: true,
          },
        },
      },
    });

    // Update User LineName and image
    if (user?.accounts[0].provider == "line") {
      const lineProfile = await lineSdk.getProfile(
        user.accounts[0].providerAccountId
      );

      await prisma.user.update({
        where: {
          id: user.accounts[0].userId,
        },
        data: {
          name: lineProfile.displayName,
          image: lineProfile.pictureUrl,
        },
      });
    }

    // Get UserProfile
    const profile = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        image: true,
        name: true,
        accounts: {
          select: {
            providerAccountId: true,
          },
        },
        profile: {
          select: {
            id: true,
            prefixId: true,
            firstname: true,
            lastname: true,
            birthday: true,
            address: true,
            citizenId: true,
            questions: {
              select: {
                createdAt: true,
                result: true,
                result_text: true,
                phqa: {
                  select: {
                    sum: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Check if user is a referent
    // let isReferent = false;

    if (profile?.profile[0]?.citizenId) {
      const referent = await prisma.referent.findFirst({
        where: {
          citizenId: profile.profile[0].citizenId,
        },
      });

      return Response.json({
        ...profile,
        referent,
      });
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

    // อัปเดตข้อมูล profile หลัก
    await prisma.profile.update({
      where: {
        id: userId,
      },
      data: {
        hn: body.hn,
        citizenId: body.citizenId,
        prefixId: body.prefixId,
        firstname: body.firstname,
        lastname: body.lastname,
        birthday: body.birthday ? new Date(body.birthday) : undefined,
        ethnicity: body.ethnicity,
        nationality: body.nationality,
        tel: body.tel,
      },
    });

    // ดึงข้อมูล address และ emergency ที่เกี่ยวข้อง
    const profileWithRelations = await prisma.profile.findUnique({
      where: {
        id: userId,
      },
      include: {
        address: true,
        emergency: true,
      },
    });

    // อัปเดตข้อมูล address
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

    // อัปเดตข้อมูล emergency
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

    // ดึงข้อมูลที่อัปเดตแล้ว
    const finalProfile = await prisma.profile.findUnique({
      where: {
        id: userId,
      },
      include: {
        address: true,
        emergency: true,
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
