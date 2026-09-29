export type ExportFieldDef = {
  key: string;
  label: string;
  selected: boolean;
};

export const ADDRESS_FIELD_KEYS = [
  "addrHouseNo",
  "addrVillageNo",
  "addrSubdistrict",
  "addrDistrict",
  "addrProvince",
] as const;

export const UNREACHABLE_FIELD_KEYS = [
  "unreachable1",
  "unreachable2",
  "unreachable3",
] as const;

export const CONTACT_ATTEMPT_FIELD_KEYS = [
  "contactAttemptDate1",
  "contactAttemptDate2",
  "contactAttemptDate3",
] as const;

/** Catalog of question-export columns (keys + Thai labels). */
export function getQuestionExportFields(): ExportFieldDef[] {
  return [
    { key: "id", label: "ลำดับ", selected: true },
    { key: "province", label: "จังหวัด", selected: true },
    { key: "hospitalCode", label: "รหัสหน่วยบริการ", selected: true },
    { key: "hospitalName", label: "ชื่อหน่วยบริการ", selected: true },
    { key: "name", label: "ชื่อ-สกุล ผู้รับบริการ", selected: true },
    { key: "citizenId", label: "เลขบัตรประชาชน", selected: true },
    { key: "birthday", label: "วันเกิด", selected: true },
    { key: "currentAge", label: "อายุปัจจุบัน", selected: true },
    {
      key: "assessmentRoundDate1",
      label: "วันที่ประเมินครั้งที่ 1",
      selected: true,
    },
    {
      key: "ageAtAssessment1",
      label: "อายุ ณ วันที่ประเมินครั้งที่ 1",
      selected: true,
    },
    {
      key: "assessmentRoundDate2",
      label: "วันที่ประเมินครั้งที่ 2",
      selected: true,
    },
    {
      key: "ageAtAssessment2",
      label: "อายุ ณ วันที่ประเมินครั้งที่ 2",
      selected: true,
    },
    { key: "sex", label: "เพศ", selected: true },
    { key: "addrHouseNo", label: "บ้านเลขที่ (ที่อยู่)", selected: true },
    { key: "addrVillageNo", label: "หมู่ (ที่อยู่)", selected: true },
    { key: "addrSubdistrict", label: "แขวง/ตำบล (ที่อยู่)", selected: true },
    { key: "addrDistrict", label: "เขต/อำเภอ (ที่อยู่)", selected: true },
    { key: "addrProvince", label: "จังหวัด (ที่อยู่)", selected: true },
    { key: "insurance", label: "สิทธิ์การรักษา", selected: true },
    { key: "school", label: "โรงเรียน", selected: true },
    { key: "grade", label: "ระดับชั้น", selected: true },
    { key: "district", label: "เขต", selected: true },
    {
      key: "serviceDate",
      label: "วันที่เข้ารับบริการคัดกรอง",
      selected: true,
    },
    { key: "phqa", label: "ผล 9Q/PHQ-A", selected: true },
    { key: "q2Result", label: "ผล Q2", selected: true },
    { key: "q8Result", label: "ผล Q8", selected: true },
    {
      key: "assessmentDate",
      label: "วันที่พบนักจิตวิทยา (รอบที่ 1)",
      selected: true,
    },
    {
      key: "visitDate2",
      label: "วันที่พบนักจิตวิทยา (รอบที่ 2)",
      selected: true,
    },
    {
      key: "visitDate3",
      label: "วันที่พบนักจิตวิทยา (รอบที่ 3)",
      selected: true,
    },
    {
      key: "unreachable1",
      label: "ติดต่อไม่ได้ (รอบที่ 1)",
      selected: true,
    },
    {
      key: "unreachable2",
      label: "ติดต่อไม่ได้ (รอบที่ 2)",
      selected: true,
    },
    {
      key: "unreachable3",
      label: "ติดต่อไม่ได้ (รอบที่ 3)",
      selected: true,
    },
    {
      key: "contactAttemptDate1",
      label: "วันที่พยายามติดต่อ (รอบที่ 1)",
      selected: true,
    },
    {
      key: "contactAttemptDate2",
      label: "วันที่พยายามติดต่อ (รอบที่ 2)",
      selected: true,
    },
    {
      key: "contactAttemptDate3",
      label: "วันที่พยายามติดต่อ (รอบที่ 3)",
      selected: true,
    },
    {
      key: "nextContactDate1",
      label: "นัดติดต่อครั้งถัดไป (รอบที่ 1)",
      selected: true,
    },
    {
      key: "nextContactDate2",
      label: "นัดติดต่อครั้งถัดไป (รอบที่ 2)",
      selected: true,
    },
    {
      key: "nextContactDate3",
      label: "นัดติดต่อครั้งถัดไป (รอบที่ 3)",
      selected: true,
    },
    {
      key: "followUpDate1",
      label: "นัดพบครั้งถัดไป (รอบที่ 1)",
      selected: true,
    },
    {
      key: "followUpDate2",
      label: "นัดพบครั้งถัดไป (รอบที่ 2)",
      selected: true,
    },
    {
      key: "followUpDate3",
      label: "นัดพบครั้งถัดไป (รอบที่ 3)",
      selected: true,
    },
    { key: "status", label: "สถานะแบบประเมิน", selected: true },
    {
      key: "referralUnit",
      label: "หน่วยบริการส่งต่อพบแพทย์",
      selected: true,
    },
    {
      key: "referentId",
      label: "รหัส อสท.",
      selected: true,
    },
    {
      key: "consultName",
      label: "นักจิตวิทยา (รอบที่ 1)",
      selected: true,
    },
    {
      key: "consultName2",
      label: "นักจิตวิทยา (รอบที่ 2)",
      selected: true,
    },
    {
      key: "consultName3",
      label: "นักจิตวิทยา (รอบที่ 3)",
      selected: true,
    },
    {
      key: "closeCaseReason",
      label: "เหตุผลปิดเคส",
      selected: true,
    },
    {
      key: "studentPhone",
      label: "เบอร์โทรนักเรียน",
      selected: true,
    },
    {
      key: "emergencyContact",
      label: "ข้อมูลผู้ติดต่อฉุกเฉิน",
      selected: true,
    },
  ];
}
