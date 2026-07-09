export const questionStatusOptions = [
  { name: "รอระบุ HN", uid: "0" },
  { name: "รอให้คำปรึกษา", uid: "1" },
  { name: "รอสรุปผลการให้คำปรึกษา", uid: "2" },
  { name: "เสร็จสิ้น", uid: "3" },
] as const;

/** Label สถานะแบบประเมิน — ใช้ร่วมกันทั้งหน้า productivity / filter */
export const QUESTION_STATUS_LABEL = {
  0: questionStatusOptions[0].name,
  1: questionStatusOptions[1].name,
  2: questionStatusOptions[2].name,
  3: questionStatusOptions[3].name,
} as const;

export const userStatusOptions = [
  { name: "ใช้งาน", uid: "1" },
  { name: "ไม่ใช้งาน", uid: "2" },
  { name: "รอยืนยันการใช้งาน", uid: "3" },
];

export const emergencyOptions = [
  { name: "ใช้งาน", uid: "1" },
  { name: "ไม่ใช้งาน", uid: "0" },
];

export const userRoles = [
  { id: 1, name: "User" },
  { id: 2, name: "Referent" },
  { id: 3, name: "Consult" },
  { id: 4, name: "Admin" },
];
