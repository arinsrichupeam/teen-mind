import { Address, Profile, EmergencyContact } from "@prisma/client";

import { getSession } from "@/lib/get-session";
import { prisma } from "@/utils/prisma";

export async function GET() {
  return Response.json("GET request successful");
}

export async function POST(req: Request) {
  let session: Awaited<ReturnType<typeof getSession>> = null;

  try {
    session = await getSession();
  } catch {
    // จับทุก error (รวม ERR_INVALID_ARG_TYPE จาก jose เมื่อ token/ payload ไม่ถูกต้อง)
    // ตอบ 401 JSON เสมอ เพื่อให้ client ไม่ได้รับ HTML หน้า error
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let data: {
    register_profile?: Profile;
    register_address?: Address;
    register_emergency?: EmergencyContact;
  };

  try {
    data = (await req.json()) as typeof data;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    !data?.register_profile ||
    !data?.register_address ||
    !data?.register_emergency
  ) {
    return Response.json(
      {
        error:
          "Missing register_profile, register_address or register_emergency",
      },
      { status: 400 }
    );
  }

  const profileRaw = data.register_profile;
  const userId = (profileRaw.userId?.trim() || session.user.id) as string;

  if (userId !== session.user.id) {
    return Response.json(
      { error: "Forbidden: ไม่สามารถลงทะเบียนแทนผู้ใช้อื่นได้" },
      { status: 403 }
    );
  }

  const birthdayValue = profileRaw.birthday;
  const birthday =
    birthdayValue instanceof Date
      ? birthdayValue
      : typeof birthdayValue === "string"
        ? new Date(birthdayValue)
        : new Date();

  const profile: Profile = {
    ...profileRaw,
    userId,
    birthday,
  } as Profile;

  const rawAddress = data.register_address;
  const rawEmergency = data.register_emergency;

  const provinceNum = Number(rawAddress?.province);
  const districtNum = Number(rawAddress?.district);
  const subdistrictNum = Number(rawAddress?.subdistrict);

  if (
    typeof rawAddress?.houseNo !== "string" ||
    typeof rawAddress?.villageNo !== "string" ||
    typeof rawAddress?.soi !== "string" ||
    typeof rawAddress?.road !== "string" ||
    Number.isNaN(provinceNum) ||
    Number.isNaN(districtNum) ||
    Number.isNaN(subdistrictNum)
  ) {
    return Response.json(
      {
        error:
          "ข้อมูลที่อยู่ไม่ครบหรือรูปแบบไม่ถูกต้อง (houseNo, villageNo, soi, road, province, district, subdistrict)",
      },
      { status: 400 }
    );
  }

  const addressForCreate = {
    houseNo: String(rawAddress.houseNo).trim() || "",
    villageNo: String(rawAddress.villageNo).trim() || "",
    soi: String(rawAddress.soi).trim() || "",
    road: String(rawAddress.road).trim() || "",
    province: provinceNum,
    district: districtNum,
    subdistrict: subdistrictNum,
  };

  const emergencyName =
    rawEmergency?.name != null ? String(rawEmergency.name).trim() : "";
  const emergencyTel =
    rawEmergency?.tel != null ? String(rawEmergency.tel).trim() : "";
  const emergencyRelation =
    rawEmergency?.relation != null ? String(rawEmergency.relation).trim() : "";

  if (!emergencyName || !emergencyTel || !emergencyRelation) {
    return Response.json(
      { error: "ข้อมูลผู้ติดต่อฉุกเฉินไม่ครบ (name, tel, relation)" },
      { status: 400 }
    );
  }

  const emergencyForCreate = {
    name: emergencyName,
    tel: emergencyTel,
    relation: emergencyRelation,
  };

  const schoolId =
    profile.schoolId == null || Number(profile.schoolId) === 0
      ? null
      : Number(profile.schoolId);
  const rawGradeYear = (profile as { gradeYear?: number | null }).gradeYear;
  const gradeYear =
    schoolId == null
      ? null
      : rawGradeYear != null && String(rawGradeYear).trim() !== ""
        ? Number(rawGradeYear)
        : null;

  // CheckProfile
  const checkProfile = await prisma.profile.findUnique({
    where: {
      userId,
    },
    select: {
      citizenId: true,
    },
  });

  if (checkProfile === null) {
    // Create User Profile With Auth

    const profileData = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        profile: {
          create: [
            {
              citizenId: profile.citizenId,
              prefixId: profile.prefixId,
              sex: profile.sex,
              firstname: profile.firstname,
              lastname: profile.lastname,
              birthday: profile.birthday,
              ethnicity: profile.ethnicity,
              nationality: profile.nationality,
              tel: profile.tel,
              schoolId,
              gradeYear,
              address: {
                create: [
                  {
                    houseNo: addressForCreate.houseNo,
                    villageNo: addressForCreate.villageNo,
                    soi: addressForCreate.soi,
                    road: addressForCreate.road,
                    province: addressForCreate.province,
                    district: addressForCreate.district,
                    subdistrict: addressForCreate.subdistrict,
                  },
                ],
              },
              emergency: {
                create: {
                  name: emergencyForCreate.name,
                  tel: emergencyForCreate.tel,
                  relation: emergencyForCreate.relation,
                },
              },
            },
          ],
        },
      },
    });

    return Response.json({ profile: profileData, ref: "" });
  } else {
    // Create User Profile With Out Auth

    const refId = await prisma.referent.findUnique({
      where: {
        citizenId: checkProfile.citizenId,
      },
      select: {
        id: true,
      },
    });

    const profileData = await prisma.profile.create({
      data: {
        citizenId: profile.citizenId,
        prefixId: profile.prefixId,
        sex: profile.sex,
        firstname: profile.firstname,
        lastname: profile.lastname,
        birthday: profile.birthday,
        ethnicity: profile.ethnicity,
        nationality: profile.nationality,
        tel: profile.tel,
        schoolId,
        gradeYear: gradeYear ?? undefined,
        address: {
          create: [
            {
              houseNo: addressForCreate.houseNo,
              villageNo: addressForCreate.villageNo,
              soi: addressForCreate.soi,
              road: addressForCreate.road,
              province: addressForCreate.province,
              district: addressForCreate.district,
              subdistrict: addressForCreate.subdistrict,
            },
          ],
        },
        emergency: {
          create: {
            name: emergencyForCreate.name,
            tel: emergencyForCreate.tel,
            relation: emergencyForCreate.relation,
          },
        },
      },
    });

    return Response.json({ profile: profileData, ref: refId });
  }
}
