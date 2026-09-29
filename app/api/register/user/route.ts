import { Address, Profile, EmergencyContact } from "@prisma/client";

import { getSession } from "@/lib/get-session";
import { mapLegacySexToSex } from "@/lib/legacy-value-mapping";
import { assertCitizenRegisterProfile } from "@/lib/register-profile-rules";
import { prisma } from "@/utils/prisma";
import { validateBirthdayValue } from "@/utils/helper";

function asOptionalString(value: unknown): string | null {
  if (value == null) return null;
  const trimmed = String(value).trim();

  return trimmed.length > 0 ? trimmed : null;
}

function asOptionalDate(value: unknown): Date | null {
  if (value == null || value === "") return null;
  const date = value instanceof Date ? value : new Date(String(value));

  return Number.isNaN(date.getTime()) ? null : date;
}

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
    registerForReferent?: boolean;
    referentRef?: string | number;
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

  const birthdayValue =
    (
      profileRaw as {
        birthday?: string | Date | null;
        birthDate?: string | Date | null;
      }
    ).birthDate ?? (profileRaw as { birthday?: string | Date | null }).birthday;

  const birthdayValidationError = validateBirthdayValue(birthdayValue);

  if (birthdayValidationError) {
    return Response.json({ error: birthdayValidationError }, { status: 400 });
  }

  const birthday =
    birthdayValue instanceof Date
      ? birthdayValue
      : new Date(String(birthdayValue));

  if (Number.isNaN(birthday.getTime())) {
    return Response.json({ error: "รูปแบบวันเกิดไม่ถูกต้อง" }, { status: 400 });
  }

  const profile: Profile = {
    ...profileRaw,
    userId,
    birthDate: birthday,
    sex: mapLegacySexToSex(profileRaw.sex),
  } as Profile;

  const rawAddress = data.register_address;
  const rawEmergency = data.register_emergency;

  const provinceNum = Number(rawAddress?.provinceId);
  const districtNum = Number(rawAddress?.districtId);
  const subdistrictNum = Number(rawAddress?.subdistrictId);

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
    provinceId: provinceNum,
    districtId: districtNum,
    subdistrictId: subdistrictNum,
  };

  const emergencyName =
    rawEmergency?.name != null ? String(rawEmergency.name).trim() : "";
  const emergencyTel =
    rawEmergency?.phone != null ? String(rawEmergency.phone).trim() : "";
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
    phone: emergencyTel,
    relation: emergencyRelation,
  };

  const isStudent = Boolean((profile as { isStudent?: boolean }).isStudent);
  const schoolId =
    !isStudent || profile.schoolId == null || Number(profile.schoolId) === 0
      ? null
      : Number(profile.schoolId);
  const rawGradeYear = (profile as { gradeYear?: number | null }).gradeYear;
  const gradeYear =
    schoolId == null
      ? null
      : rawGradeYear != null && String(rawGradeYear).trim() !== ""
        ? Number(rawGradeYear)
        : null;
  const healthcareFacilityId =
    typeof profile.healthcareFacilityId === "string" &&
    profile.healthcareFacilityId.trim()
      ? profile.healthcareFacilityId.trim()
      : null;

  try {
    assertCitizenRegisterProfile({
      healthcareFacilityId,
      isStudent,
      schoolId,
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "ข้อมูลโปรไฟล์ไม่ครบ" },
      { status: 400 }
    );
  }

  const registerForReferent = data.registerForReferent === true;
  const referentRefRaw = data.referentRef;
  const referentRefFromClient =
    referentRefRaw != null && String(referentRefRaw).trim() !== ""
      ? parseInt(String(referentRefRaw), 10)
      : null;

  const existingUserProfile = await prisma.profile.findUnique({
    where: {
      userId,
    },
    select: {
      citizenId: true,
    },
  });

  let referentId: number | null =
    referentRefFromClient != null && !Number.isNaN(referentRefFromClient)
      ? referentRefFromClient
      : null;

  if (referentId != null) {
    const activeVolunteer = await prisma.volunteer.findFirst({
      where: { id: referentId, status: true },
      select: { id: true },
    });

    referentId = activeVolunteer?.id ?? null;
  }

  if (referentId == null && existingUserProfile?.citizenId) {
    const refRecord = await prisma.volunteer.findFirst({
      where: {
        citizenId: existingUserProfile.citizenId,
        status: true,
      },
      select: {
        id: true,
      },
    });

    referentId = refRecord?.id ?? null;
  }

  const shouldRegisterYouth =
    registerForReferent ||
    (existingUserProfile !== null && referentId !== null);

  const youthProfileData = {
    citizenId: profile.citizenId,
    prefixId: profile.prefixId,
    sex: profile.sex,
    firstName: profile.firstName,
    lastName: profile.lastName,
    birthDate: profile.birthDate,
    ethnicity: profile.ethnicity,
    nationality: profile.nationality,
    phone: profile.phone,
    hn: profile.hn?.trim() || "",
    schoolId,
    gradeYear: gradeYear ?? undefined,
    isStudent,
    healthcareFacilityId,
    mainInsclCode: asOptionalString(
      (profile as { mainInsclCode?: string | null }).mainInsclCode
    ),
    mainInsclName: asOptionalString(
      (profile as { mainInsclName?: string | null }).mainInsclName
    ),
    subInsclCode: asOptionalString(
      (profile as { subInsclCode?: string | null }).subInsclCode
    ),
    subInsclName: asOptionalString(
      (profile as { subInsclName?: string | null }).subInsclName
    ),
    hmainCode: asOptionalString(
      (profile as { hmainCode?: string | null }).hmainCode
    ),
    hmainName: asOptionalString(
      (profile as { hmainName?: string | null }).hmainName
    ),
    hsubCode: asOptionalString(
      (profile as { hsubCode?: string | null }).hsubCode
    ),
    hsubName: asOptionalString(
      (profile as { hsubName?: string | null }).hsubName
    ),
    nhsoVerifiedAt: asOptionalDate(
      (profile as { nhsoVerifiedAt?: string | Date | null }).nhsoVerifiedAt
    ),
    addresses: {
      create: [
        {
          houseNo: addressForCreate.houseNo,
          villageNo: addressForCreate.villageNo,
          soi: addressForCreate.soi,
          road: addressForCreate.road,
          provinceId: addressForCreate.provinceId,
          districtId: addressForCreate.districtId,
          subdistrictId: addressForCreate.subdistrictId,
        },
      ],
    },
    emergencyContacts: {
      create: {
        name: emergencyForCreate.name,
        phone: emergencyForCreate.phone,
        relation: emergencyForCreate.relation,
      },
    },
  };

  if (shouldRegisterYouth) {
    const profileData = await prisma.profile.create({
      data: youthProfileData,
    });

    return Response.json({
      profile: profileData,
      ref: referentId != null ? { id: referentId } : null,
      isReferentYouth: true,
    });
  }

  if (existingUserProfile === null) {
    const profileData = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        profile: {
          create: youthProfileData,
        },
      },
      include: {
        profile: true,
      },
    });

    return Response.json({
      profile: profileData.profile,
      ref: "",
      isReferentYouth: false,
    });
  }

  return Response.json(
    { error: "ไม่สามารถลงทะเบียนซ้ำได้ กรุณาติดต่อผู้ดูแลระบบ" },
    { status: 400 }
  );
}
