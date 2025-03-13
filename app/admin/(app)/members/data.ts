export const QuestionColumnsName = [
  { name: "ลำดับที่", uid: "id", align: "center" },
  { name: "ชื่อ - สกุล", uid: "name", align: "start" },
  { name: "สาขาวิชาชีพ", uid: "professional", align: "center" },
  { name: "สังกัด", uid: "affiliation", align: "start" },
  { name: "หน่วยงาน", uid: "agency", align: "start" },
  { name: "ระดับการใช้งาน", uid: "role", align: "center" },
  { name: "สถานะ", uid: "status", align: "center" },
  { name: "", uid: "actions", align: "center" },
];

export const statusOptions = [
  { name: "ใช้งาน", uid: "1" },
  { name: "ไม่ใช้งาน", uid: "2" },
  { name: "รอยืนยันการใช้งาน", uid: "3" },
];

export const roles = [
  { id: 1, name: "User" },
  { id: 2, name: "Referent" },
  { id: 3, name: "Consult" },
  { id: 4, name: "Admin" },
];
