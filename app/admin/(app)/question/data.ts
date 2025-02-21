export const columns = [
  { name: "ลำดับที่", uid: "id", sortable: true },
  { name: "ชื่อ - สกุล", uid: "name" },
  { name: "อายุ", uid: "age" },
  { name: "โรงเรียน", uid: "school" },
  { name: "ผลการประเมิน", uid: "result" },
  { name: "PHQA", uid: "phqa" },
  { name: "วันที่ประเมิน", uid: "date" },
  { name: "สถานะ", uid: "status", sortable: true },
  { name: "", uid: "actions" },
];

export const statusOptions = [
  { name: "active", uid: "0" },
  { name: "paused", uid: "1" },
  { name: "vacation", uid: "2" },
];
