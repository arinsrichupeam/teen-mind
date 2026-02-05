import lineSdk from "@/utils/linesdk";
import { prisma } from "@/utils/prisma";
import { getSession } from "@/lib/get-session";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (await params).id;

  if (session.user.id !== userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

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

    if (!profile) {
      return Response.json(null, { status: 404 });
    }

    const account = profile.accounts?.[0];

    // ดึง referent (ที่จำเป็นต้องใช้ใน response) แยกจาก LINE sync
    let referent = null;
    const profileRecord = Array.isArray(profile.profile)
      ? profile.profile[0]
      : (profile.profile as any);

    if (profileRecord?.citizenId) {
      referent = await prisma.referent.findFirst({
        where: { citizenId: profileRecord.citizenId },
      });
    }

    // อัปเดตชื่อ/รูปจาก LINE แบบไม่ block response (fire-and-forget)
    if (account?.provider === "line") {
      void (async () => {
        try {
          const lineProfile = await lineSdk.getProfile(
            account.providerAccountId
          );

          await prisma.user.update({
            where: { id: account.userId },
            data: {
              name: lineProfile.displayName ?? null,
              image: lineProfile.pictureUrl ?? null,
            },
          });
        } catch (error) {
          // log ไว้เพื่อ debug ภายหลัง แต่ไม่ให้กระทบ response หลัก
          // eslint-disable-next-line no-console
          console.error(
            "[profile-sync] ไม่สามารถ sync ข้อมูลจาก LINE ได้",
            {
              userId: account.userId,
              providerAccountId: account.providerAccountId,
            },
            error
          );
        }
      })();
    }

    if (referent) {
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
  const session = await getSession();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (await params).id;

  if (session.user.id !== userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();

    const existingProfile = await prisma.profile.findFirst({
      where: { userId },
      include: { address: true, emergency: true },
    });

    if (!existingProfile) {
      return Response.json(
        { success: false, message: "ไม่พบโปรไฟล์ของผู้ใช้" },
        { status: 404 }
      );
    }

    const profileId = existingProfile.id;

    await prisma.profile.update({
      where: { id: profileId },
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

    const addressUpdate =
      existingProfile.address && existingProfile.address.length > 0
        ? prisma.address.update({
            where: {
              id: existingProfile.address[0].id,
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
          })
        : Promise.resolve();

    const emergencyUpdate =
      existingProfile.emergency && existingProfile.emergency.length > 0
        ? prisma.emergencyContact.update({
            where: {
              id: existingProfile.emergency[0].id,
            },
            data: {
              name: body.emergency.name,
              tel: body.emergency.tel,
              relation: body.emergency.relation,
            },
          })
        : Promise.resolve();

    await Promise.all([addressUpdate, emergencyUpdate]);

    if (body.hn && body.hn !== "") {
      await prisma.questions_Master.updateMany({
        where: {
          profileId,
          status: 0,
        },
        data: {
          status: 1,
        },
      });
    }

    const finalProfile = await prisma.profile.findUnique({
      where: { id: profileId },
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
