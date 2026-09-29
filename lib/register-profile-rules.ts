/**
 * Citizen register invariants for Bangkok Mind wave 1.
 */
export function assertCitizenRegisterProfile(input: {
  healthcareFacilityId: string | null | undefined;
  isStudent: boolean;
  schoolId: number | null | undefined;
}): void {
  if (!input.healthcareFacilityId?.trim()) {
    throw new Error("กรุณาเลือกสถานพยาบาล");
  }

  if (input.isStudent) {
    const schoolId = Number(input.schoolId);

    if (!schoolId || Number.isNaN(schoolId)) {
      throw new Error("นักเรียนต้องระบุโรงเรียน");
    }
  }
}
