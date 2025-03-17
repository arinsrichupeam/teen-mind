import { ProfileAdminData } from "@/types";
import { prisma } from "@/utils/prisma";

export async function GET() {
  const data = await prisma.profile_Admin.findMany({
    select: {
      id: true,
      userId: true,
      prefixId: true,
      firstname: true,
      lastname: true,
      professional: true,
      affiliationId: true,
      agency: true,
      role: true,
      status: true,
    },
  });

  return Response.json(data);
}

export async function POST(req: Request) {
  const data = await req.json();
  const profile_data: ProfileAdminData = data.profile_data;

  await prisma.profile_Admin.update({
    where: {
      id: profile_data.id,
    },
    data: {
      prefixId: parseInt(profile_data.prefixId.toString()),
      firstname: profile_data.firstname,
      lastname: profile_data.lastname,
      affiliationId: parseInt(profile_data.affiliationId.toString()),
      agency: profile_data.agency,
      tel: profile_data.tel,
      employeeTypeId: parseInt(profile_data.employeeTypeId.toString()),
      professional: profile_data.professional,
      license: profile_data.license,
      status: parseInt(profile_data.status.toString()),
      role: {
        set: {
          id: parseInt(profile_data.role.toString()),
        },
      },
    },
  });

  return Response.json("Success");
}
