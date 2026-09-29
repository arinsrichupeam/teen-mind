/**
 * BKK Mind psychologist session report (structured fields on TreatmentNote).
 * Option lists follow the project Google Form; distinct from QuestionProblem.
 */

import { Prisma } from "@prisma/client";

export const SESSION_SELF_HARM_RISKS = [
  "FOUND",
  "NOT_FOUND",
  "NOT_ASSESSABLE",
] as const;
export type SessionSelfHarmRiskCode = (typeof SESSION_SELF_HARM_RISKS)[number];

export const PSYCH_RISK_SEVERITIES = [
  "NONE",
  "LOW",
  "MODERATE",
  "HIGH",
  "SEVERE",
] as const;
export type PsychRiskSeverity = (typeof PSYCH_RISK_SEVERITIES)[number];

export const SESSION_OUTCOMES = [
  "IMPROVED",
  "WORSENED",
  "UNCHANGED",
  "NOT_ASSESSABLE",
] as const;
export type SessionOutcomeCode = (typeof SESSION_OUTCOMES)[number];

export const AFTER_CARE_PLANS = [
  "END_FOLLOWUP",
  "PSYCHOLOGIST_FOLLOWUP",
  "PSYCHIATRIST",
  "TRANSFER_FACILITY",
  "TRANSFER_EMERGENCY",
  "OTHER",
] as const;
export type AfterCarePlanCode = (typeof AFTER_CARE_PLANS)[number];

export const PRESENTING_TOPIC_CODES = [
  "FAMILY",
  "RELATIONSHIP",
  "WORK",
  "STUDY",
  "EMOTION",
  "MENTAL_HEALTH",
  "SLEEP",
  "PHYSICAL_HEALTH",
  "FINANCE",
  "GRIEF",
  "SELF_HARM",
  "SUBSTANCE",
  "OTHER",
] as const;
export type PresentingTopicCode = (typeof PRESENTING_TOPIC_CODES)[number];

export const INTERVENTION_CODES = [
  "SUPPORTIVE_COUNSELING",
  "PSYCHOEDUCATION",
  "STRESS_COPING",
  "SELF_CARE_SKILLS",
  "FURTHER_MH_ASSESSMENT",
  "SELF_HARM_RISK_ASSESSMENT",
  "SAFETY_PLAN",
  "REFER_PSYCHIATRIST",
  "COORDINATE_TRANSFER",
  "COORDINATE_SUPPORT_NETWORK",
  "SCHEDULE_FOLLOWUP",
  "OTHER",
] as const;
export type InterventionCode = (typeof INTERVENTION_CODES)[number];

export const PRESENTING_TOPIC_OPTIONS: {
  value: PresentingTopicCode;
  label: string;
}[] = [
  {
    value: "FAMILY",
    label:
      "ปัญหาครอบครัว เช่น ความขัดแย้งกับพ่อแม่ ความคาดหวังในครอบครัว การสื่อสาร",
  },
  {
    value: "RELATIONSHIP",
    label:
      "ปัญหาความสัมพันธ์ เช่น คู่รัก/สามีภรรยา ความไม่เข้าใจกัน การนอกใจ การเลิกรา",
  },
  {
    value: "WORK",
    label:
      "ปัญหาการทำงาน เช่น ความเครียดจากงาน ภาวะหมดไฟ ความสัมพันธ์กับเพื่อนร่วมงาน/หัวหน้า",
  },
  {
    value: "STUDY",
    label: "ปัญหาการเรียน เช่น ความกดดัน การปรับตัว แรงจูงใจในการเรียน",
  },
  {
    value: "EMOTION",
    label: "ปัญหาด้านอารมณ์ เช่น เครียด วิตกกังวล เศร้า หรือจัดการอารมณ์ได้ยาก",
  },
  {
    value: "MENTAL_HEALTH",
    label:
      "ปัญหาสุขภาพจิต/อาการทางจิตเวช เช่น มีอาการเดิมกำเริบ ต้องการคำแนะนำเกี่ยวกับการรักษา",
  },
  {
    value: "SLEEP",
    label: "ปัญหาการนอน เช่น นอนไม่หลับ หลับยาก หลับไม่ต่อเนื่อง",
  },
  {
    value: "PHYSICAL_HEALTH",
    label: "ปัญหาสุขภาพกาย/การเจ็บป่วย เช่น ความกังวลหรือการปรับตัวต่อโรค",
  },
  { value: "FINANCE", label: "ปัญหาการเงิน/เศรษฐกิจ" },
  { value: "GRIEF", label: "การสูญเสีย/ความโศกเศร้า" },
  {
    value: "SELF_HARM",
    label: "ความคิดหรือพฤติกรรมทำร้ายตนเอง/ฆ่าตัวตาย",
  },
  { value: "SUBSTANCE", label: "การใช้สุรา/สารเสพติด" },
  { value: "OTHER", label: "อื่นๆ" },
];

export const INTERVENTION_OPTIONS: {
  value: InterventionCode;
  label: string;
}[] = [
  {
    value: "SUPPORTIVE_COUNSELING",
    label: "รับฟังและให้การปรึกษาเชิงประคับประคอง",
  },
  {
    value: "PSYCHOEDUCATION",
    label: "ให้ข้อมูล/สุขภาพจิตศึกษา (Psychoeducation)",
  },
  { value: "STRESS_COPING", label: "แนะนำวิธีจัดการความเครียด/อารมณ์" },
  { value: "SELF_CARE_SKILLS", label: "ฝึกทักษะหรือเทคนิคการดูแลตนเอง" },
  {
    value: "FURTHER_MH_ASSESSMENT",
    label: "ประเมินอาการทางสุขภาพจิตเพิ่มเติม",
  },
  {
    value: "SELF_HARM_RISK_ASSESSMENT",
    label: "ประเมินความเสี่ยงต่อการทำร้ายตนเอง/ฆ่าตัวตาย",
  },
  { value: "SAFETY_PLAN", label: "วางแผนความปลอดภัย (Safety plan)" },
  { value: "REFER_PSYCHIATRIST", label: "แนะนำให้พบจิตแพทย์" },
  { value: "COORDINATE_TRANSFER", label: "ประสาน/ส่งต่อหน่วยบริการ" },
  {
    value: "COORDINATE_SUPPORT_NETWORK",
    label: "ประสานบุคคลใกล้ชิดหรือหน่วยงานที่เกี่ยวข้อง",
  },
  { value: "SCHEDULE_FOLLOWUP", label: "นัดติดตาม" },
  { value: "OTHER", label: "อื่นๆ" },
];

export const SESSION_SELF_HARM_RISK_OPTIONS: {
  value: SessionSelfHarmRiskCode;
  label: string;
}[] = [
  { value: "FOUND", label: "พบ" },
  { value: "NOT_FOUND", label: "ไม่พบ" },
  { value: "NOT_ASSESSABLE", label: "ไม่สามารถประเมินได้" },
];

export const SESSION_OUTCOME_OPTIONS: {
  value: SessionOutcomeCode;
  label: string;
}[] = [
  { value: "IMPROVED", label: "ผู้รับบริการรายงานว่ารู้สึกดีขึ้น" },
  { value: "WORSENED", label: "ผู้รับบริการรายงานว่ารู้สึกแย่ลง" },
  { value: "UNCHANGED", label: "ผู้รับบริการรายงานว่าใกล้เคียงเดิม" },
  { value: "NOT_ASSESSABLE", label: "ไม่สามารถประเมินได้" },
];

export const AFTER_CARE_PLAN_OPTIONS: {
  value: AfterCarePlanCode;
  label: string;
}[] = [
  {
    value: "END_FOLLOWUP",
    label: "ยุติการติดตาม/ไม่จำเป็นต้องติดตามต่อ",
  },
  { value: "PSYCHOLOGIST_FOLLOWUP", label: "นัดติดตามโดยนักจิตวิทยา" },
  { value: "PSYCHIATRIST", label: "นัด/แนะนำพบจิตแพทย์" },
  { value: "TRANSFER_FACILITY", label: "ส่งต่อหน่วยบริการอื่น" },
  {
    value: "TRANSFER_EMERGENCY",
    label: "ส่งต่อเพื่อรับการดูแลเร่งด่วน/ฉุกเฉิน",
  },
  { value: "OTHER", label: "อื่นๆ" },
];

export const PSYCH_RISK_OPTIONS: {
  value: PsychRiskSeverity;
  label: string;
}[] = [
  { value: "NONE", label: "ไม่มีความเสี่ยง" },
  { value: "LOW", label: "น้อย" },
  { value: "MODERATE", label: "ปานกลาง" },
  { value: "HIGH", label: "มาก" },
  { value: "SEVERE", label: "รุนแรง" },
];

export type SessionReportFields = {
  unreachable?: boolean | null;
  serviceEndedAt?: Date | string | null;
  sessionSelfHarmRisk?: string | null;
  psychRisk?: string | null;
  presentingTopics?: string[] | null;
  presentingTopicsOther?: string | null;
  interventions?: string[] | null;
  interventionsOther?: string | null;
  sessionOutcome?: string | null;
  afterCarePlan?: string | null;
  afterCarePlanOther?: string | null;
  followUp?: Date | string | null;
  subjective?: string | null;
  objective?: string | null;
  assessment?: string | null;
  plan?: string | null;
};

function isNonEmptyText(v: unknown): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

function isFilledDate(v: unknown): boolean {
  if (v == null || v === "") return false;
  if (v instanceof Date) return !Number.isNaN(v.getTime());
  const d = new Date(String(v));

  return !Number.isNaN(d.getTime());
}

function asStringList(v: unknown): string[] {
  if (!Array.isArray(v)) return [];

  return v.filter((x): x is string => typeof x === "string");
}

export function isSoapFieldsComplete(note: SessionReportFields): boolean {
  return (
    isNonEmptyText(note.subjective) &&
    isNonEmptyText(note.objective) &&
    isNonEmptyText(note.assessment) &&
    isNonEmptyText(note.plan)
  );
}

export function isTransferAfterCare(
  plan: AfterCarePlanCode | null | undefined
): boolean {
  return plan === "TRANSFER_FACILITY" || plan === "TRANSFER_EMERGENCY";
}

export function isEndFollowUpAfterCare(
  plan: AfterCarePlanCode | null | undefined
): boolean {
  return plan === "END_FOLLOWUP";
}

/** True when a reached note's session report (+ PsychRisk rules) is complete. */
export function isSessionReportComplete(note: SessionReportFields): boolean {
  if (note.unreachable) return true;

  if (!isFilledDate(note.serviceEndedAt)) return false;
  if (!note.sessionSelfHarmRisk) return false;
  if (
    !SESSION_SELF_HARM_RISKS.includes(
      note.sessionSelfHarmRisk as SessionSelfHarmRiskCode
    )
  ) {
    return false;
  }

  if (
    !note.psychRisk ||
    !PSYCH_RISK_SEVERITIES.includes(note.psychRisk as PsychRiskSeverity)
  ) {
    return false;
  }

  const topics = asStringList(note.presentingTopics);

  if (topics.length === 0) return false;
  if (
    topics.some(
      (t) => !(PRESENTING_TOPIC_CODES as readonly string[]).includes(t)
    )
  ) {
    return false;
  }
  if (topics.includes("OTHER") && !isNonEmptyText(note.presentingTopicsOther)) {
    return false;
  }

  const interventions = asStringList(note.interventions);

  if (interventions.length === 0) return false;
  if (
    interventions.some(
      (t) => !(INTERVENTION_CODES as readonly string[]).includes(t)
    )
  ) {
    return false;
  }
  if (
    interventions.includes("OTHER") &&
    !isNonEmptyText(note.interventionsOther)
  ) {
    return false;
  }

  if (
    !note.sessionOutcome ||
    !(SESSION_OUTCOMES as readonly string[]).includes(note.sessionOutcome)
  ) {
    return false;
  }

  if (
    !note.afterCarePlan ||
    !(AFTER_CARE_PLANS as readonly string[]).includes(note.afterCarePlan)
  ) {
    return false;
  }
  if (
    note.afterCarePlan === "OTHER" &&
    !isNonEmptyText(note.afterCarePlanOther)
  ) {
    return false;
  }
  if (
    note.afterCarePlan === "PSYCHOLOGIST_FOLLOWUP" &&
    !isFilledDate(note.followUp)
  ) {
    return false;
  }

  return true;
}

/**
 * Throws Error with Thai message when reached + SOAP-complete note
 * is missing a valid session report (or PsychRisk rules fail).
 */
export function assertSessionReportForSoapSave(
  note: SessionReportFields
): void {
  if (note.unreachable) return;
  if (!isSoapFieldsComplete(note)) return;

  if (!isSessionReportComplete(note)) {
    if (
      !note.psychRisk ||
      !PSYCH_RISK_SEVERITIES.includes(note.psychRisk as PsychRiskSeverity)
    ) {
      throw new Error(
        "กรุณาระบุระดับความเสี่ยงที่นักจิตประเมิน (ไม่มีความเสี่ยง / น้อย / ปานกลาง / มาก / รุนแรง)"
      );
    }
    if (
      note.afterCarePlan === "PSYCHOLOGIST_FOLLOWUP" &&
      !isFilledDate(note.followUp)
    ) {
      throw new Error(
        "แผนนัดติดตามโดยนักจิตวิทยา — กรุณาระบุวันนัดพบครั้งถัดไป"
      );
    }
    throw new Error(
      "กรุณากรอกแบบบันทึกการติดตามและให้คำปรึกษาให้ครบก่อนบันทึกรอบ"
    );
  }
}

/** Clear session-report fields for unreachable notes before persist. */
export function clearedSessionReportFields() {
  return {
    serviceEndedAt: null as Date | null,
    sessionSelfHarmRisk: null as null,
    psychRisk: null as null,
    presentingTopics: Prisma.JsonNull,
    presentingTopicsOther: null as null,
    interventions: Prisma.JsonNull,
    interventionsOther: null as null,
    sessionOutcome: null as null,
    afterCarePlan: null as null,
    afterCarePlanOther: null as null,
  };
}
