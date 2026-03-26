import type { FollowUpRoundTrackingStatus, QuestionsData } from "@/types";

/** Consultant & Telemedicine ต่อรอบ (ตรงกับ schema questions_master) */
export const CONSULT_TELEMED_ROUNDS = [
  { schedule: "schedule_telemed", consult: "consult", label: "รอบที่ 1" },
  {
    schedule: "schedule_telemed2",
    consult: "consult2",
    label: "รอบที่ 2",
  },
  {
    schedule: "schedule_telemed3",
    consult: "consult3",
    label: "รอบที่ 3",
  },
] as const;

/** นัดพบครั้งถัดไป ต่อรอบ (ตรงกับ schema questions_master) */
export const FOLLOW_UP_ROUNDS = [
  { followUp: "follow_up", label: "รอบที่ 1" },
  { followUp: "follow_up2", label: "รอบที่ 2" },
  { followUp: "follow_up3", label: "รอบที่ 3" },
] as const;

/** Discharge Summary SOAP + หมายเหตุ ต่อรอบ */
export const DISCHARGE_SUMMARY_ROUNDS = [
  {
    subjective: "subjective",
    objective: "objective",
    assessment: "assessment",
    plan: "plan",
    note: "note",
    label: "รอบที่ 1",
  },
  {
    subjective: "subjective2",
    objective: "objective2",
    assessment: "assessment2",
    plan: "plan2",
    note: "note2",
    label: "รอบที่ 2",
  },
  {
    subjective: "subjective3",
    objective: "objective3",
    assessment: "assessment3",
    plan: "plan3",
    note: "note3",
    label: "รอบที่ 3",
  },
] as const;

function isNonEmptyText(v: unknown): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

/** รอบที่มีวันนัด + ผู้ให้คำปรึกษา */
export function isConsultTelemedRoundComplete(
  q: QuestionsData | undefined,
  roundIndex: 0 | 1 | 2
): boolean {
  if (!q) return false;

  const round = CONSULT_TELEMED_ROUNDS[roundIndex];
  const sched = q[round.schedule as keyof QuestionsData];
  const cons = q[round.consult as keyof QuestionsData] as
    | string
    | null
    | undefined;

  return Boolean(sched && cons && String(cons).trim() !== "");
}

/** SOAP ครบ 4 ช่อง (ไม่รวมหมายเหตุ) */
export function isDischargeSoapRoundComplete(
  q: QuestionsData | undefined,
  roundIndex: 0 | 1 | 2
): boolean {
  if (!q) return false;

  const round = DISCHARGE_SUMMARY_ROUNDS[roundIndex];

  return (
    isNonEmptyText(q[round.subjective as keyof QuestionsData]) &&
    isNonEmptyText(q[round.objective as keyof QuestionsData]) &&
    isNonEmptyText(q[round.assessment as keyof QuestionsData]) &&
    isNonEmptyText(q[round.plan as keyof QuestionsData])
  );
}

/** ครั้งติดตามหนึ่งครั้ง = นัด Telemed + ผู้ให้คำปรึกษา + Discharge SOAP ครบ */
export function isFollowUpRoundComplete(
  q: QuestionsData | undefined,
  roundIndex: 0 | 1 | 2
): boolean {
  return (
    isConsultTelemedRoundComplete(q, roundIndex) &&
    isDischargeSoapRoundComplete(q, roundIndex)
  );
}

/** เสร็จสิ้นทั้งเคส = ครบทั้ง 3 ครั้งติดตาม */
export function isAllFollowUpRoundsComplete(
  q: QuestionsData | undefined
): boolean {
  return (
    isFollowUpRoundComplete(q, 0) &&
    isFollowUpRoundComplete(q, 1) &&
    isFollowUpRoundComplete(q, 2)
  );
}

/** สถานะติดตามครั้งที่ 1, 2, 3 สำหรับแสดงผลหรือ API */
export function getFollowUpRoundStatuses(
  q: QuestionsData | undefined
): FollowUpRoundTrackingStatus[] {
  return ([0, 1, 2] as const).map((idx) => {
    const round = (idx + 1) as 1 | 2 | 3;
    const consultTelemedComplete = isConsultTelemedRoundComplete(q, idx);
    const dischargeSoapComplete = isDischargeSoapRoundComplete(q, idx);
    const complete = consultTelemedComplete && dischargeSoapComplete;

    return {
      round,
      complete,
      statusLabel: complete ? "ครบแล้ว" : "ยังไม่ครบ",
      title: `สถานะติดตามครั้งที่ ${round}`,
      consultTelemedComplete,
      dischargeSoapComplete,
    };
  });
}
