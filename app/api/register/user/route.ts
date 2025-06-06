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

  // Get UserProfile From DB
  const user = await prisma.user.findUnique({
    where: {
      id: profile.userId as string,
    },
    select: {
      profile: true,
    },
  });

  if (user?.profile.length) {
    // console.log("Update Profile");
  } else {
    await prisma.user.update({
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
  }

  return new Response("Success");
}
