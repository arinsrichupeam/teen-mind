import lineSdk from "@/utils/linesdk";
import { prisma } from "@/utils/prisma";
import { image } from "@nextui-org/theme";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    // read query
    const userId = (await params).id

    // Get User From DB
    const user = await prisma.user.findUnique({
        where: {
            id: userId
        },
        select: {
            accounts: {
                select: {
                    userId: true,
                    provider: true,
                    providerAccountId: true,
                },
            }
        }
    });

    // // Update User LineName and image
    if (user?.accounts[0].provider == "line") {
        const lineProfile = await lineSdk.getProfile(user.accounts[0].providerAccountId);
        await prisma.user.update({
            where: {
                id: user.accounts[0].userId
            },
            data: {
                name: lineProfile.displayName,
                image: lineProfile.pictureUrl
            }
        });
    }

    // // Get UserProfile
    const profile = await prisma.user.findUnique({
        where: {
            id: userId
        },
        select: {
            id: true,
            email: true,
            image: true,
            name: true,
            accounts: {
                select: {
                    providerAccountId: true,
                },
            },
            profile: {
                select: {
                    id: true
                },
            },
        },
    });

    return Response.json(profile);
}