import lineSdk from "@/utils/linesdk";
import { prisma } from "@/utils/prisma";
import { getSession, requireAdmin } from "@/lib/get-session";
import { mapLegacySexToSex } from "@/lib/legacy-value-mapping";
import { validateBirthdayValue } from "@/utils/helper";

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
            firstName: true,
            lastName: true,
            birthDate: true,
            ethnicity: true,
            nationality: true,
            hn: true,
            phone: true,
            addresses: true,
            citizenId: true,
            schoolId: true,
            gradeYear: true,
            school: true,
            emergencyContacts: true,
            cases: {
              select: {
                createdAt: true,
                result: true,
                questionsPhqa: {
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
    const profileRecord = profile.profile;

    // LIFF / types ยังคาด profile เป็น array + questions/address/emergency ชื่อเดิม
    const profileForClient = profileRecord
      ? [
          {
            ...profileRecord,
            questions: profileRecord.cases ?? [],
            address: profileRecord.addresses ?? [],
            emergency: profileRecord.emergencyContacts ?? [],
          },
        ]
      : [];

    const profilePayload = {
      id: profile.id,
      image: profile.image,
      name: profile.name,
      accounts: profile.accounts,
      profile: profileForClient,
      // liff/page.tsx เช็ค val.questions ที่ top-level
      questions: profileRecord?.cases ?? [],
    };

    if (profileRecord?.citizenId) {
      referent = await prisma.volunteer.findFirst({
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
      return Response.json({ ...profilePayload, referent });
    }

    return Response.json(profilePayload);
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

  const idParam = (await params).id;

  try {
    const body = await req.json();

    let existingProfile = await prisma.profile.findFirst({
      where: { userId: idParam },
      include: { addresses: true, emergencyContacts: true },
    });

    if (existingProfile) {
      if (session.user.id !== idParam) {
        const auth = await requireAdmin();

        if (!auth) {
          return Response.json({ error: "Forbidden" }, { status: 403 });
        }
      }
    } else {
      const auth = await requireAdmin();

      if (!auth) {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }

      existingProfile = await prisma.profile.findUnique({
        where: { id: idParam },
        include: { addresses: true, emergencyContacts: true },
      });
    }

    if (!existingProfile) {
      return Response.json(
        { success: false, message: "ไม่พบโปรไฟล์ของผู้ใช้" },
        { status: 404 }
      );
    }

    const profileId = existingProfile.id;

    if (body.birthDate) {
      const birthdayValidationError = validateBirthdayValue(body.birthDate);

      if (birthdayValidationError) {
        return Response.json(
          { success: false, message: birthdayValidationError },
          { status: 400 }
        );
      }
    }

    const rawSchoolId = body.schoolId;
    const normalizedSchoolId =
      rawSchoolId != null &&
      rawSchoolId !== "" &&
      Number.isFinite(Number(rawSchoolId)) &&
      Number(rawSchoolId) > 0
        ? Number(rawSchoolId)
        : null;

    await prisma.profile.update({
      where: { id: profileId },
      data: {
        hn: body.hn ?? undefined,
        citizenId: body.citizenId,
        prefixId: Number(body.prefixId),
        sex: mapLegacySexToSex(body.sex),
        firstName: body.firstName,
        lastName: body.lastName,
        birthDate: body.birthDate ? new Date(body.birthDate) : undefined,
        ethnicity: body.ethnicity,
        nationality: body.nationality,
        phone: body.phone,
        schoolId: normalizedSchoolId,
        gradeYear:
          normalizedSchoolId == null
            ? null
            : body.gradeYear != null && body.gradeYear !== ""
              ? Number(body.gradeYear)
              : null,
      },
    });

    const addressPayload = body.addresses;
    const addressUpdate =
      addressPayload != null
        ? existingProfile.addresses.length > 0
          ? prisma.address.update({
              where: { id: existingProfile.addresses[0].id },
              data: {
                houseNo: String(addressPayload.houseNo ?? ""),
                villageNo: String(addressPayload.villageNo ?? ""),
                soi: String(addressPayload.soi ?? ""),
                road: String(addressPayload.road ?? ""),
                subdistrictId: Number(addressPayload.subdistrictId) || 0,
                districtId: Number(addressPayload.districtId) || 0,
                provinceId: Number(addressPayload.provinceId) || 0,
              },
            })
          : prisma.address.create({
              data: {
                profileId,
                houseNo: String(addressPayload.houseNo ?? ""),
                villageNo: String(addressPayload.villageNo ?? ""),
                soi: String(addressPayload.soi ?? ""),
                road: String(addressPayload.road ?? ""),
                subdistrictId: Number(addressPayload.subdistrictId) || 0,
                districtId: Number(addressPayload.districtId) || 0,
                provinceId: Number(addressPayload.provinceId) || 0,
              },
            })
        : Promise.resolve();

    const emergencyPayload = body.emergencyContacts;
    const emergencyUpdate =
      emergencyPayload != null
        ? existingProfile.emergencyContacts.length > 0
          ? prisma.emergencyContact.update({
              where: { id: existingProfile.emergencyContacts[0].id },
              data: {
                name: String(emergencyPayload.name ?? ""),
                phone: String(emergencyPayload.phone ?? ""),
                relation: String(emergencyPayload.relation ?? ""),
              },
            })
          : prisma.emergencyContact.create({
              data: {
                profileId,
                name: String(emergencyPayload.name ?? ""),
                phone: String(emergencyPayload.phone ?? ""),
                relation: String(emergencyPayload.relation ?? ""),
              },
            })
        : Promise.resolve();

    await Promise.all([addressUpdate, emergencyUpdate]);

    if (body.hn && body.hn !== "") {
      // HN is on Profile; CaseStatus no longer tracks "awaiting HN" (legacy 0→1).
    }

    const finalProfile = await prisma.profile.findUnique({
      where: { id: profileId },
      include: {
        addresses: true,
        emergencyContacts: true,
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
