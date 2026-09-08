import { Volunteer } from "@prisma/client";

import { requireAdmin } from "@/lib/get-session";
import { prisma } from "@/utils/prisma";

export async function GET() {
  const auth = await requireAdmin();

  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await prisma.volunteer.findMany({
    where: {
      status: true,
    },
  });

  return Response.json(data);
}

export async function POST(req: Request) {
  const data = await req.json();

  let userId = "";

  const volunteer: Volunteer = data.referent_data;

  await prisma.volunteer
    .create({
      data: {
        citizenId: volunteer.citizenId.toString(),
        prefixId: parseInt(volunteer.prefixId.toString()),
        firstName: volunteer.firstName,
        lastName: volunteer.lastName,
        email: volunteer.email,
        phone: volunteer.phone,
        volunteerTypeId: parseInt(
          String(
            (volunteer as Volunteer & { volunteer_type_id?: number })
              .volunteerTypeId ??
              (volunteer as Volunteer & { volunteer_type_id?: number })
                .volunteer_type_id
          )
        ),
        employeeTypeId: parseInt(
          String(
            (volunteer as Volunteer & { employee_type_id?: number })
              .employeeTypeId ??
              (volunteer as Volunteer & { employee_type_id?: number })
                .employee_type_id
          )
        ),
        affiliationId: parseInt(
          String(
            (volunteer as Volunteer & { affiliation_id?: number })
              .affiliationId ??
              (volunteer as Volunteer & { affiliation_id?: number })
                .affiliation_id
          )
        ),
        healthcareFacilityId: String(
          (volunteer as Volunteer & { agency?: string }).healthcareFacilityId ??
            (volunteer as Volunteer & { agency?: string }).agency ??
            ""
        ),
        status: volunteer.status,
      },
    })
    .then((val) => {
      const idLength = val.id.toString().length;

      userId = val.id.toString().padStart(idLength < 3 ? 3 : idLength, "0");
    })
    .catch(() => {
      userId = "000";
    });

  return Response.json(userId);
}
