import { Volunteer } from "@prisma/client";

import { requireAdminOnly } from "@/lib/get-session";
import { resolveFacilityUnitId } from "@/lib/resolve-facility-unit";
import { prisma } from "@/utils/prisma";
import { prefix } from "@/utils/data";

export async function GET() {
  const auth = await requireAdminOnly();

  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const referents = await prisma.volunteer.findMany({
      include: {
        affiliation: true,
        volunteerType: true,
        employeeType: true,
        healthcareFacility: { select: { id: true, name: true } },
        facilityUnit: { select: { id: true, name: true } },
        cases: {
          include: {
            profile: { select: { id: true } },
          },
        },
      },
      orderBy: { id: "asc" },
    });

    const formattedReferents = referents.map((referent) => {
      const questionCountByUser = referent.cases.reduce(
        (acc: Record<string, number>, question) => {
          const profileId = question.profile?.id || "unknown";

          acc[profileId] = (acc[profileId] || 0) + 1;

          return acc;
        },
        {} as Record<string, number>
      );

      return {
        id: referent.id,
        citizenId: referent.citizenId,
        prefixId: referent.prefixId,
        firstName: referent.firstName,
        lastName: referent.lastName,
        email: referent.email,
        phone: referent.phone,
        volunteerTypeId: referent.volunteerTypeId,
        employeeTypeId: referent.employeeTypeId,
        affiliationId: referent.affiliationId,
        healthcareFacilityId: referent.healthcareFacilityId,
        facilityUnitId: referent.facilityUnitId,
        status: referent.status,
        createdAt: referent.createdAt,
        updatedAt: referent.updatedAt,
        affiliation: referent.affiliation,
        volunteerType: referent.volunteerType,
        employeeType: referent.employeeType,
        healthcareFacility: referent.healthcareFacility,
        facilityUnit: referent.facilityUnit,
        prefix:
          prefix.find((p) => p.key === referent.prefixId?.toString())?.label ||
          "",
        question_count: Object.keys(questionCountByUser).length,
      };
    });

    return Response.json(formattedReferents);
  } catch (error) {
    return Response.json(
      { error: "Failed to fetch referents : " + error },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const auth = await requireAdminOnly();

  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    const volunteer = (data.referent_data ?? data) as Volunteer & {
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

    if (!volunteer.citizenId?.toString().trim()) {
      return Response.json(
        { error: "กรุณากรอกเลขบัตรประชาชน" },
        { status: 400 }
      );
    }

    const unitResult = await resolveFacilityUnitId({
      healthcareFacilityId,
      facilityUnitId: volunteer.facilityUnitId,
      newFacilityUnitName: volunteer.newFacilityUnitName,
    });

    if ("error" in unitResult) {
      return Response.json({ error: unitResult.error }, { status: 400 });
    }

    const created = await prisma.volunteer.create({
      data: {
        citizenId: volunteer.citizenId.toString(),
        prefixId: parseInt(volunteer.prefixId.toString(), 10),
        firstName: volunteer.firstName,
        lastName: volunteer.lastName,
        email: volunteer.email,
        phone: volunteer.phone,
        volunteerTypeId: parseInt(
          String(volunteer.volunteerTypeId ?? volunteer.volunteer_type_id),
          10
        ),
        employeeTypeId: parseInt(
          String(volunteer.employeeTypeId ?? volunteer.employee_type_id),
          10
        ),
        affiliationId: parseInt(
          String(volunteer.affiliationId ?? volunteer.affiliation_id),
          10
        ),
        healthcareFacilityId,
        facilityUnitId: unitResult.id,
        status: volunteer.status ?? true,
      },
    });

    return Response.json({ success: true, data: created });
  } catch (error) {
    const message = (error as Error).message || String(error);

    if (message.includes("Unique constraint") || message.includes("Unique")) {
      return Response.json(
        { error: "เลขบัตรประชาชนหรืออีเมลนี้ถูกลงทะเบียนแล้ว" },
        { status: 409 }
      );
    }

    return Response.json({ error: message }, { status: 500 });
  }
}
