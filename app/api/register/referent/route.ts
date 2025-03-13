import { Referent } from "@prisma/client";

import { prisma } from "@/utils/prisma";

export async function GET() {
  const data = await prisma.referent.findMany({
    where: {
      status: true,
    },
  });

  return Response.json(data);
}

export async function POST(req: Request) {
  const data = await req.json();

  let userId = "";

  const referent: Referent = data.referent_data;

  await prisma.referent
    .create({
      data: {
        citizenId: referent.citizenId.toString(),
        prefixId: parseInt(referent.prefixId.toString()),
        firstname: referent.firstname,
        lastname: referent.lastname,
        email: referent.email,
        tel: referent.tel,
        volunteer_type_id: parseInt(referent.volunteer_type_id.toString()),
        employee_type_id: parseInt(referent.employee_type_id.toString()),
        affiliation_id: parseInt(referent.affiliation_id.toString()),
        agency: referent.agency,
        status: referent.status,
      },
    })
    .then((val) => {
      const idLength = val.id.toString().length;

      userId = val.id.toString().padStart(idLength < 3 ? 3 : idLength, "0");
    });

  return Response.json(userId);
}
