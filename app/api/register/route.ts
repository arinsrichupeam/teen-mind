import { Register } from '@/types/register';
import { prisma } from '@/utils/prisma';
import { Address, Profile } from '@prisma/client';
import { NextApiRequest } from 'next';

export async function GET() {
    return Response.json("GET request successful");
}

export async function POST(req: NextApiRequest) {
    // const data: Register = await req.json();

    // const profile: Profile = data.register_profile;
    // const address: Address = data.register_address;

    const result = req.body;
    console.log(result);

    // Get UserProfile From DB
    // const user = await prisma.user.findUnique({
    //     where: {
    //         id: profile.userId
    //     },
    //     select: {
    //         profile: true
    //     }
    // });

    // if (user?.profile.length) {
    //     console.log("Update Profile");
    // }
    // else {
    //     console.log("Create Profile");

    //     await prisma.user.update({
    //         where: {
    //             id: profile.userId
    //         },
    //         data: {
    //             profile: {
    //                 create: {
    //                     citizenId: profile.citizenId,
    //                     prefix: profile.prefix,
    //                     sex: profile.sex,
    //                     firstname: profile.firstname,
    //                     lastname: profile.lastname,
    //                     birthday: profile.birthday,
    //                     ethnicity: profile.ethnicity,
    //                     nationality: profile.nationality,
    //                     tel: profile.tel,
    //                     createdAt: profile.createdAt,
    //                     address: {
    //                         create: {
    //                             houseNo: address.houseNo,
    //                             villageNo: address.villageNo,
    //                             soi: address.soi,
    //                             road: address.road,
    //                             province: address.province,
    //                             district: address.district,
    //                             subdistrict: address.subdistrict
    //                         }
    //                     }
    //                 }
    //             }
    //         }
    //     });
    // }

    return new Response("Success");
}