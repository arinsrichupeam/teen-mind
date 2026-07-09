import { QUESTION_STATUS_LABEL } from "../../data/optionData";

/** ชื่อสถานะที่ใช้ในหน้าประสิทธิภาพนักจิตวิทยา (อ้างอิง Questions_Master.status) */
export const PRODUCTIVITY_STATUS = {
  awaitingConsult: QUESTION_STATUS_LABEL[1],
  awaitingSummary: QUESTION_STATUS_LABEL[2],
  completed: QUESTION_STATUS_LABEL[3],
  unreachable: "ติดต่อไม่ได้",
  completionRate: "อัตราเสร็จสิ้น",
} as const;
