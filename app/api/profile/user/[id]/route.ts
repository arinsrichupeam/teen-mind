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
