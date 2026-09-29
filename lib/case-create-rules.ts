import {
  isWave1CitizenPackage,
  WAVE1_CITIZEN_PACKAGE,
} from "./depression-flow";

/** CaseStatus values that block opening another Case for the same Profile. */
export const OPEN_CASE_STATUSES = [
  "PENDING",
  "IN_PROGRESS",
  "TRANSFER_PENDING",
] as const;

export type OpenCaseStatus = (typeof OPEN_CASE_STATUSES)[number];

export type CitizenCaseCreateInput = {
  healthcareFacilityId: string | null | undefined;
  packageName: string;
  hasOpenCase: boolean;
};

/**
 * Wave-1 citizen Case create invariants (CONTEXT + ADR 0003/0005).
 * Throws Error with a Thai or English message suitable for API 400 bodies.
 */
export function assertCitizenCaseCreate(
  input: CitizenCaseCreateInput
): asserts input is CitizenCaseCreateInput & {
  healthcareFacilityId: string;
  packageName: typeof WAVE1_CITIZEN_PACKAGE;
} {
  if (!input.healthcareFacilityId?.trim()) {
    throw new Error("ต้องเลือกสถานพยาบาล (HealthcareFacility) ก่อนสร้างเคส");
  }

  if (!isWave1CitizenPackage(input.packageName)) {
    throw new Error(
      `แพ็กเกจต้องเป็น ${WAVE1_CITIZEN_PACKAGE} ในช่วงแรก (ได้ ${input.packageName})`
    );
  }

  if (input.hasOpenCase) {
    throw new Error("มีเคสที่ยังไม่ปิดอยู่แล้ว — ไม่สามารถเปิดเคสใหม่ได้");
  }
}
