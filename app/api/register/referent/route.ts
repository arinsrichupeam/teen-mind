import { Volunteer } from "@prisma/client";

import { requireAdmin } from "@/lib/get-session";
import { resolveFacilityUnitId } from "@/lib/resolve-facility-unit";
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

  const volunteer = data.referent_data as Volunteer & {
    volunteer_type_id?: number;
    employee_type_id?: number;
    affiliation_id?: number;
    agency?: string;
    facilityUnitId?: number | null;
    newFacilityUnitName?: string | null;
  };

  const healthcareFacilityId = String(
    volunteer.healthcareFacilityId ?? volunteer.agency ?? ""
  ).trim();

  if (!healthcareFacilityId) {
    return Response.json({ error: "กรุณาเลือกหน่วยงาน" }, { status: 400 });
  }

  const unitResult = await resolveFacilityUnitId({
    healthcareFacilityId,
    facilityUnitId: volunteer.facilityUnitId,
    newFacilityUnitName: volunteer.newFacilityUnitName,
  });

  if ("error" in unitResult) {
    return Response.json({ error: unitResult.error }, { status: 400 });
  }

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
          String(volunteer.volunteerTypeId ?? volunteer.volunteer_type_id)
        ),
        employeeTypeId: parseInt(
          String(volunteer.employeeTypeId ?? volunteer.employee_type_id)
        ),
        affiliationId: parseInt(
          String(volunteer.affiliationId ?? volunteer.affiliation_id)
        ),
        healthcareFacilityId,
        facilityUnitId: unitResult.id,
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
