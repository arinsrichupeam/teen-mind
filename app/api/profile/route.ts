import { prisma } from "@/utils/prisma";

// Update Profile
export async function PUT(req: Request) {
    const data = await req.json();

}

// Update Profile -> HN
export async function PATCH(req: Request) {
    const data = await req.json();
    console.log(data);

    return new Response("Success");
}