import { prisma } from "@/utils/prisma";

function parseOptionalFacilityUnitId(value: unknown): number | null {
  if (value == null || value === "" || value === 0 || value === "0") {
    return null;
  }

  const id = typeof value === "number" ? value : parseInt(String(value), 10);

  // Negative / zero IDs are local UI placeholders for newly typed names
  return Number.isNaN(id) || id <= 0 ? null : id;
}

/**
 * Resolve optional FacilityUnit under a facility: existing id, or create/find by name.
 */
export async function resolveFacilityUnitId(opts: {
  healthcareFacilityId: string;
  facilityUnitId?: unknown;
  newFacilityUnitName?: string | null;
}): Promise<{ id: number | null } | { error: string }> {
  const name = opts.newFacilityUnitName?.trim();

  if (name) {
    const existing = await prisma.facilityUnit.findFirst({
      where: {
        healthcareFacilityId: opts.healthcareFacilityId,
        name,
      },
      select: { id: true },
    });

    if (existing) return { id: existing.id };

    const created = await prisma.facilityUnit.create({
      data: {
        name,
        healthcareFacilityId: opts.healthcareFacilityId,
        status: true,
      },
      select: { id: true },
    });

    return { id: created.id };
  }

  const facilityUnitId = parseOptionalFacilityUnitId(opts.facilityUnitId);

  if (facilityUnitId == null) return { id: null };

  const unit = await prisma.facilityUnit.findFirst({
    where: {
      id: facilityUnitId,
      healthcareFacilityId: opts.healthcareFacilityId,
      status: true,
    },
    select: { id: true },
  });

  if (!unit) {
    return { error: "หน่วยงานย่อยไม่ตรงกับหน่วยงานที่เลือก" };
  }

  return { id: unit.id };
}
