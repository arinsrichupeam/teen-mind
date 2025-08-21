export const QuestionColumnsName = [
  { name: "ชื่อ - สกุล", uid: "name", align: "start" },
  { name: "อายุ", uid: "age", align: "center" },
  { name: "โรงเรียน", uid: "school", align: "start" },
  { name: "ผลการประเมิน", uid: "phqa", align: "center" },
  { name: "PHQA", uid: "result", align: "center" },
  { name: "2Q", uid: "2q", align: "center" },
  // { name: "PHQA-9", uid: "phqa-9", align: "center" },
  { name: "Addon", uid: "addon", align: "center" },
  { name: "วันที่ประเมิน", uid: "screeningDate", align: "center" },
  { name: "สถานะ", uid: "status", align: "center" },
  { name: "", uid: "actions", align: "center" },
];

export const VolunteerColumnsName = [
  {
    uid: "id",
    name: "รหัส",
    align: "center",
  },
  {
    uid: "name",
    name: "ชื่อ - นามสกุล",
    align: "start",
  },
  {
    uid: "affiliation",
    name: "สังกัด",
    align: "start",
  },
  {
    uid: "agency",
    name: "หน่วยงาน",
    align: "start",
  },
  {
    uid: "question_count",
    name: "จำนวนแบบสอบถาม",
    align: "center",
  },
  {
    uid: "status",
    name: "สถานะ",
    align: "center",
  },
  {
    uid: "actions",
    name: "",
    align: "center",
  },
];

export const MemberColumnsName = [
  { name: "ลำดับที่", uid: "id", align: "center" },
  { name: "ชื่อ - สกุล", uid: "name", align: "start" },
  { name: "สาขาวิชาชีพ", uid: "professional", align: "center" },
  { name: "สังกัด", uid: "affiliation", align: "start" },
  { name: "หน่วยงาน", uid: "agency", align: "start" },
  { name: "ระดับการใช้งาน", uid: "role", align: "center" },
  { name: "สถานะ", uid: "status", align: "center" },
  { name: "Emergency Alert", uid: "alert", align: "center" },
  { name: "", uid: "actions", align: "center" },
];

export const SchoolListColumnsName = [
  { name: "ลำดับที่", uid: "id", align: "center" },
  { name: "ชื่อโรงเรียน", uid: "school", align: "start" },
  { name: "เขต", uid: "area", align: "start" },
  { name: "วันที่คัดกรอง", uid: "screeningDate", align: "center" },
  { name: "สถานะ", uid: "status", align: "center" },
  { name: "", uid: "actions", align: "center" },
];
