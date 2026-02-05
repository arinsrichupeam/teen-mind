import { ProfileAdminData } from "@/types";
import { prisma } from "@/utils/prisma";
import { requireAdmin } from "@/lib/get-session";

export async function GET() {
  const auth = await requireAdmin();

  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await prisma.profile_Admin.findMany({
    include: {
      user: {
        select: {
          image: true,
        },
      },
      role: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return Response.json(data);
}

export async function POST(req: Request) {
  const auth = await requireAdmin();

  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

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
      alert: profile_data.alert,
      status: parseInt(profile_data.status.toString()),
      roleId: parseInt(profile_data.roleId.toString()),
    },
  });

  return Response.json("Success");
}
