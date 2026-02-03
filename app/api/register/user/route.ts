import { Address, Profile, EmergencyContact } from "@prisma/client";

import { prisma } from "@/utils/prisma";

export async function GET() {
  return Response.json("GET request successful");
}

export async function POST(req: Request) {
  const data = await req.json();

  const profile: Profile = data.register_profile;
  const address: Address = data.register_address;
  const emergency: EmergencyContact = data.register_emergency;

  // CheckProfile
  const checkProfile = await prisma.profile.findUnique({
    where: {
      userId: profile.userId as string,
    },
    select: {
      citizenId: true,
    },
  });

  if (checkProfile === null) {
    // Create User Profile With Auth

    const profileData = await prisma.user.update({
      where: {
        id: profile.userId as string,
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
              schoolId: profile.schoolId,
              gradeYear: profile.gradeYear,
              address: {
                create: [
                  {
                    houseNo: address.houseNo,
                    villageNo: address.villageNo,
                    soi: address.soi,
                    road: address.road,
                    province: address.province,
                    district: address.district,
                    subdistrict: address.subdistrict,
                  },
                ],
              },
              emergency: {
                create: {
                  name: emergency.name as string,
                  tel: emergency.tel as string,
                  relation: emergency.relation as string,
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
        schoolId: profile.schoolId,
        gradeYear: profile.gradeYear ?? undefined,
        address: {
          create: [
            {
              houseNo: address.houseNo,
              villageNo: address.villageNo,
              soi: address.soi,
              road: address.road,
              province: address.province,
              district: address.district,
              subdistrict: address.subdistrict,
            },
          ],
        },
        emergency: {
          create: {
            name: emergency.name as string,
            tel: emergency.tel as string,
            relation: emergency.relation as string,
          },
        },
      },
    });

    return Response.json({ profile: profileData, ref: refId });
  }
}
