import { ProfileAdminData } from "@/types";
import lineSdk from "@/utils/linesdk";
import { prisma } from "@/utils/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // read query
  const userId = (await params).id;

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

  // Get AdminProfile
  const profile = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      image: true,
      name: true,
      accounts: {
        select: {
          providerAccountId: true,
        },
      },
      profile_admin: {
        include: {
          role: true,
        },
      },
    },
  });

  const result: ProfileAdminData = {
    id: profile?.profile_admin[0].id as string,
    userId: profile?.profile_admin[0].userId as string,
    providerAccountId: profile?.accounts[0].providerAccountId as string,
    image: profile?.image as string,
    name: profile?.name as string,
    citizenId: profile?.profile_admin[0].citizenId as string,
    prefixId: profile?.profile_admin[0].prefixId as number,
    firstname: profile?.profile_admin[0].firstname as string,
    lastname: profile?.profile_admin[0].lastname as string,
    tel: profile?.profile_admin[0].tel as string,
    affiliationId: profile?.profile_admin[0].affiliationId as number,
    agency: profile?.profile_admin[0].agency as string,
    employeeTypeId: profile?.profile_admin[0].employeeTypeId as number,
    professional: profile?.profile_admin[0].professional as string,
    license: profile?.profile_admin[0].license as string,
    status: profile?.profile_admin[0].status as number,
    createdAt: "",
    updatedAt: "",
    role: profile?.profile_admin[0].role[0].id as number,
  };

  return Response.json(result);
}
