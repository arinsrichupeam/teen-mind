import type { QuestionsData } from "@/types";

import {
  formatThaiMonthLabel,
  toThailandMonthKey,
} from "@/lib/dashboard/parse-dashboard-date";
import {
  CONSULT_TELEMED_ROUNDS,
  isConsultTelemedRoundComplete,
  isDischargeSoapRoundComplete,
  isRoundUnreachable,
} from "@/lib/question-followup-rounds";
import { isLegacyDateOnlyUtc } from "@/utils/helper";

export type PsychologistMonthlyDetailRow = {
  monthKey: string;
  monthLabel: string;
  userId: string;
  name: string;
  assignedSessions: number;
  completedSessions: number;
  soapPending: number;
  telemedPending: number;
  unreachable: number;
  completionRate: number;
};

export type PsychologistProductivityRow = {
  userId: string;
  name: string;
  activeCases: number;
  status0: number;
  status1: number;
  status2: number;
  status3: number;
  assignedSessions: number;
  completedSessions: number;
  soapPending: number;
  telemedPending: number;
  unreachable: number;
  completionRate: number;
};

export type MonthlyProductivityPoint = {
  monthKey: string;
  monthLabel: string;
  assigned: number;
  completed: number;
};

export type RedCase24hAccessSummary = {
  /** Case Red ในช่วงที่เลือก (นับตามวันที่คัดกรอง) */
  total: number;
  /** พบนักจิตครั้งที่ 1 ภายใน 24 ชม. หลังคัดกรอง */
  within24h: number;
  /** เปอร์เซ็นต์การเข้าถึงภายใน 24 ชม. */
  rate: number;
  /** จำนวนเคสแดงที่พบนักจิตรอบ 1 แล้ว (ใช้คำนวณค่าเฉลี่ย) */
  reached: number;
  /** ค่าเฉลี่ยชั่วโมงจากคัดกรอง → พบนักจิตรอบ 1 (เฉพาะเคสที่พบแล้ว) */
  avgAccessHours: number | null;
};

export type PsychologistProductivityStats = {
  label: string | null;
  summary: {
    activePsychologists: number;
    totalActiveCases: number;
    statusBreakdown: {
      status0: number;
      status1: number;
      status2: number;
      status3: number;
    };
    totalAssignedSessions: number;
    totalCompletedSessions: number;
    overallCompletionRate: number;
    soapPending: number;
    telemedPending: number;
    unreachable: number;
    redCase24hAccess: RedCase24hAccessSummary;
  };
  psychologists: PsychologistProductivityRow[];
  psychologistMonthly: PsychologistMonthlyDetailRow[];
  monthlyTrend: MonthlyProductivityPoint[];
};

type SessionRecord = {
  userId: string;
  questionId: string;
  profileId: string;
  questionStatus: 0 | 1 | 2 | 3 | null;
  round: 1 | 2 | 3;
  sessionDate: Date | null;
  questionCreatedAt: Date;
  consultTelemedComplete: boolean;
  dischargeSoapComplete: boolean;
  roundComplete: boolean;
  unreachable: boolean;
};

export type QuestionLike = {
  id: string;
  profileId: string;
  createdAt: Date | string;
  status?: number | null;
  result?: string | null;
  consult: string | null;
  consult2?: string | null;
  consult3?: string | null;
  schedule_telemed: Date | null;
  schedule_telemed2?: Date | null;
  schedule_telemed3?: Date | null;
  subjective?: string | null;
  objective?: string | null;
  assessment?: string | null;
  plan?: string | null;
  subjective2?: string | null;
  objective2?: string | null;
  assessment2?: string | null;
  plan2?: string | null;
  subjective3?: string | null;
  objective3?: string | null;
  assessment3?: string | null;
  plan3?: string | null;
  unreachable?: boolean | null;
  unreachable2?: boolean | null;
  unreachable3?: boolean | null;
};

const MS_HOUR = 60 * 60 * 1000;

type AdminNameLookup = Map<
  string,
  { prefixId: number; firstname: string; lastname: string }
>;

const toQuestionData = (q: QuestionLike): QuestionsData =>
  ({
    ...q,
    consult: q.consult ?? "",
    consult2: q.consult2 ?? "",
    consult3: q.consult3 ?? "",
    createdAt:
      q.createdAt instanceof Date
        ? q.createdAt.toISOString()
        : String(q.createdAt),
    profile: { hn: "" },
    hn: "",
  }) as unknown as QuestionsData;

const normalizeQuestionStatus = (status: number | null | undefined) => {
  if (typeof status !== "number") return null;
  if (status < 0 || status > 3) return null;

  return status as 0 | 1 | 2 | 3;
};

const completedRoundsByStatus = (status: 0 | 1 | 2 | 3) => {
  if (status === 3) return 3;
  if (status === 2) return 1;

  return 0;
};

const toDate = (value: Date | string) =>
  value instanceof Date ? value : new Date(value);

const emptyRedCase24hAccess = (): RedCase24hAccessSummary => ({
  total: 0,
  within24h: 0,
  rate: 0,
  reached: 0,
  avgAccessHours: null,
});

const round1 = (value: number) => Math.round(value * 10) / 10;

/** ข้ามเคสที่บันทึกวันพบแบบไม่มีเวลา (legacy date-only) — คำนวณ SLA 24 ชม. ไม่ได้ */
const isLegacyScheduleTelemed = (question: QuestionLike) => {
  if (!question.schedule_telemed) return false;

  return isLegacyDateOnlyUtc(toDate(question.schedule_telemed));
};

/** ชั่วโมงจากคัดกรอง → พบนักจิตรอบ 1 (null ถ้ายังไม่พบ / ข้อมูลไม่ครบ / ไม่มีเวลา) */
export function getRedCaseAccessDelayHours(
  question: QuestionLike
): number | null {
  if (question.result !== "Red") return null;
  if (!question.schedule_telemed) return null;
  if (isLegacyScheduleTelemed(question)) return null;

  const qData = toQuestionData(question);

  if (!isConsultTelemedRoundComplete(qData, 0)) return null;

  const createdAt = toDate(question.createdAt);
  const sessionDate = toDate(question.schedule_telemed);
  const delayMs = sessionDate.getTime() - createdAt.getTime();

  if (delayMs < 0) return null;

  return delayMs / MS_HOUR;
}

/** Case Red ที่พบนักจิตครั้งที่ 1 (schedule_telemed) ภายใน 24 ชม. นับจากวันที่คัดกรอง */
export function isRedCaseReachedWithin24h(question: QuestionLike): boolean {
  const hours = getRedCaseAccessDelayHours(question);

  return hours !== null && hours <= 24;
}

const computeRedCase24hAccess = (
  questions: QuestionLike[],
  dateRange?: { startUtc: Date; endUtc: Date }
): RedCase24hAccessSummary => {
  const redCases = questions.filter((q) => {
    if (q.result !== "Red") return false;
    if (isLegacyScheduleTelemed(q)) return false;
    if (!dateRange) return true;

    const screenedAt = toDate(q.createdAt);

    return screenedAt >= dateRange.startUtc && screenedAt < dateRange.endUtc;
  });

  const delays = redCases
    .map(getRedCaseAccessDelayHours)
    .filter((hours): hours is number => hours !== null);
  const within24h = delays.filter((hours) => hours <= 24).length;
  const avgAccessHours =
    delays.length > 0
      ? round1(delays.reduce((sum, h) => sum + h, 0) / delays.length)
      : null;

  return {
    total: redCases.length,
    within24h,
    rate: calcCompletionRate(within24h, redCases.length),
    reached: delays.length,
    avgAccessHours,
  };
};

const extractSessions = (questions: QuestionLike[]): SessionRecord[] => {
  const sessions: SessionRecord[] = [];

  for (const question of questions) {
    const qData = toQuestionData(question);
    const createdAt = toDate(question.createdAt);
    const normalizedStatus = normalizeQuestionStatus(question.status);
    const completedRounds =
      normalizedStatus !== null ? completedRoundsByStatus(normalizedStatus) : 0;

    CONSULT_TELEMED_ROUNDS.forEach((round, roundIndex) => {
      const userId = String(
        qData[round.consult as keyof QuestionsData] ?? ""
      ).trim();

      if (!userId) return;

      const sched = qData[round.schedule as keyof QuestionsData];
      const sessionDate =
        sched instanceof Date
          ? sched
          : sched
            ? new Date(sched as string)
            : null;
      const roundNumber = (roundIndex + 1) as 1 | 2 | 3;

      const unreachable = isRoundUnreachable(qData, roundIndex as 0 | 1 | 2);
      const roundCompleteFromStatus = roundNumber <= completedRounds;
      // ใช้ Questions_Master.status เป็นแหล่งอ้างอิงหลักของสถานะงาน
      const consultTelemedComplete =
        normalizedStatus !== null
          ? roundCompleteFromStatus
          : isConsultTelemedRoundComplete(qData, roundIndex as 0 | 1 | 2);
      const dischargeSoapComplete =
        normalizedStatus !== null
          ? roundCompleteFromStatus
          : isDischargeSoapRoundComplete(qData, roundIndex as 0 | 1 | 2);

      sessions.push({
        userId,
        questionId: question.id,
        profileId: question.profileId,
        questionStatus: normalizedStatus,
        round: roundNumber,
        sessionDate,
        questionCreatedAt: createdAt,
        consultTelemedComplete,
        dischargeSoapComplete,
        roundComplete: consultTelemedComplete && dischargeSoapComplete,
        unreachable,
      });
    });
  }

  return sessions;
};

const sessionInDateRange = (
  session: SessionRecord,
  startUtc?: Date,
  endUtc?: Date
) => {
  if (!startUtc || !endUtc) return true;

  if (session.sessionDate) {
    return session.sessionDate >= startUtc && session.sessionDate < endUtc;
  }

  return (
    session.questionCreatedAt >= startUtc && session.questionCreatedAt < endUtc
  );
};

const formatAdminName = (
  userId: string,
  lookup: AdminNameLookup,
  prefixMap: Map<string, string>
) => {
  const admin = lookup.get(userId);

  if (!admin) return userId;

  const prefixLabel = prefixMap.get(String(admin.prefixId)) ?? "";

  return `${prefixLabel} ${admin.firstname} ${admin.lastname}`.trim();
};

const calcCompletionRate = (completed: number, assigned: number) =>
  assigned > 0 ? Math.round((completed / assigned) * 1000) / 10 : 0;

const getStatusBreakdown = (statuses: Array<0 | 1 | 2 | 3 | null>) => {
  const counts = {
    status0: 0,
    status1: 0,
    status2: 0,
    status3: 0,
  };

  for (const status of statuses) {
    if (status === 0) counts.status0 += 1;
    if (status === 1) counts.status1 += 1;
    if (status === 2) counts.status2 += 1;
    if (status === 3) counts.status3 += 1;
  }

  return counts;
};

export function emptyPsychologistProductivityStats(
  label: string | null = "ข้อมูลทั้งหมด"
): PsychologistProductivityStats {
  return {
    label,
    summary: {
      activePsychologists: 0,
      totalActiveCases: 0,
      statusBreakdown: {
        status0: 0,
        status1: 0,
        status2: 0,
        status3: 0,
      },
      totalAssignedSessions: 0,
      totalCompletedSessions: 0,
      overallCompletionRate: 0,
      soapPending: 0,
      telemedPending: 0,
      unreachable: 0,
      redCase24hAccess: emptyRedCase24hAccess(),
    },
    psychologists: [],
    psychologistMonthly: [],
    monthlyTrend: [],
  };
}

export function computePsychologistProductivity(
  questions: QuestionLike[],
  adminLookup: AdminNameLookup,
  prefixMap: Map<string, string>,
  label: string | null,
  dateRange?: { startUtc: Date; endUtc: Date }
): PsychologistProductivityStats {
  const redCase24hAccess = computeRedCase24hAccess(questions, dateRange);
  const allSessions = extractSessions(questions);
  const sessions = dateRange
    ? allSessions.filter((s) =>
        sessionInDateRange(s, dateRange.startUtc, dateRange.endUtc)
      )
    : allSessions;

  if (sessions.length === 0) {
    const empty = emptyPsychologistProductivityStats(label);

    return {
      ...empty,
      summary: {
        ...empty.summary,
        redCase24hAccess,
      },
    };
  }

  const byPsychologist = new Map<
    string,
    {
      caseIds: Set<string>;
      statusByCase: Map<string, 0 | 1 | 2 | 3 | null>;
      assignedSessions: number;
      completedSessions: number;
      soapPending: number;
      telemedPending: number;
      unreachable: number;
    }
  >();

  const monthlyMap = new Map<string, { assigned: number; completed: number }>();
  const psychologistMonthMap = new Map<
    string,
    {
      userId: string;
      monthKey: string;
      assignedSessions: number;
      completedSessions: number;
      soapPending: number;
      telemedPending: number;
      unreachable: number;
    }
  >();

  for (const session of sessions) {
    const bucket = byPsychologist.get(session.userId) ?? {
      caseIds: new Set<string>(),
      statusByCase: new Map<string, 0 | 1 | 2 | 3 | null>(),
      assignedSessions: 0,
      completedSessions: 0,
      soapPending: 0,
      telemedPending: 0,
      unreachable: 0,
    };

    bucket.caseIds.add(session.questionId);
    bucket.statusByCase.set(session.questionId, session.questionStatus);

    // รอบที่ "ติดต่อไม่ได้" นับแยกต่างหาก ไม่รวมใน assigned/completed/pending
    if (session.unreachable) {
      bucket.unreachable += 1;
    } else {
      bucket.assignedSessions += 1;

      if (session.roundComplete) {
        bucket.completedSessions += 1;
      } else if (
        session.consultTelemedComplete &&
        !session.dischargeSoapComplete
      ) {
        bucket.soapPending += 1;
      } else if (!session.consultTelemedComplete) {
        bucket.telemedPending += 1;
      }
    }

    byPsychologist.set(session.userId, bucket);

    const trendDate = session.sessionDate ?? session.questionCreatedAt;
    const monthKey = toThailandMonthKey(trendDate);
    const monthPsychKey = `${session.userId}|${monthKey}`;
    const monthPsychBucket = psychologistMonthMap.get(monthPsychKey) ?? {
      userId: session.userId,
      monthKey,
      assignedSessions: 0,
      completedSessions: 0,
      soapPending: 0,
      telemedPending: 0,
      unreachable: 0,
    };

    if (session.unreachable) {
      monthPsychBucket.unreachable += 1;
    } else {
      monthPsychBucket.assignedSessions += 1;

      if (session.roundComplete) {
        monthPsychBucket.completedSessions += 1;
      } else if (
        session.consultTelemedComplete &&
        !session.dischargeSoapComplete
      ) {
        monthPsychBucket.soapPending += 1;
      } else if (!session.consultTelemedComplete) {
        monthPsychBucket.telemedPending += 1;
      }
    }

    psychologistMonthMap.set(monthPsychKey, monthPsychBucket);

    const monthBucket = monthlyMap.get(monthKey) ?? {
      assigned: 0,
      completed: 0,
    };

    if (!session.unreachable) {
      monthBucket.assigned += 1;
      if (session.roundComplete) monthBucket.completed += 1;
    }
    monthlyMap.set(monthKey, monthBucket);
  }

  const psychologists: PsychologistProductivityRow[] = Array.from(
    byPsychologist.entries()
  )
    .map(([userId, stats]) => {
      const statusBreakdown = getStatusBreakdown(
        Array.from(stats.statusByCase.values())
      );

      return {
        userId,
        name: formatAdminName(userId, adminLookup, prefixMap),
        activeCases: stats.caseIds.size,
        ...statusBreakdown,
        assignedSessions: stats.assignedSessions,
        completedSessions: stats.completedSessions,
        soapPending: stats.soapPending,
        telemedPending: stats.telemedPending,
        unreachable: stats.unreachable,
        completionRate: calcCompletionRate(
          statusBreakdown.status3,
          stats.caseIds.size
        ),
      };
    })
    .sort((a, b) => b.status3 - a.status3 || b.activeCases - a.activeCases);

  const summaryAssigned = sessions.filter((s) => !s.unreachable).length;
  const summaryCompleted = sessions.filter((s) => s.roundComplete).length;
  const summaryUnreachable = sessions.filter((s) => s.unreachable).length;
  const uniqueCases = new Set(sessions.map((s) => s.questionId));
  const statusByCase = new Map<string, 0 | 1 | 2 | 3 | null>();

  for (const session of sessions) {
    if (!statusByCase.has(session.questionId)) {
      statusByCase.set(session.questionId, session.questionStatus);
    }
  }

  const summaryStatusBreakdown = getStatusBreakdown(
    Array.from(statusByCase.values())
  );

  return {
    label,
    summary: {
      activePsychologists: psychologists.length,
      totalActiveCases: uniqueCases.size,
      statusBreakdown: summaryStatusBreakdown,
      totalAssignedSessions: summaryAssigned,
      totalCompletedSessions: summaryCompleted,
      overallCompletionRate: calcCompletionRate(
        summaryStatusBreakdown.status3,
        uniqueCases.size
      ),
      soapPending: psychologists.reduce((sum, p) => sum + p.soapPending, 0),
      telemedPending: psychologists.reduce(
        (sum, p) => sum + p.telemedPending,
        0
      ),
      unreachable: summaryUnreachable,
      redCase24hAccess,
    },
    psychologists,
    psychologistMonthly: Array.from(psychologistMonthMap.values())
      .map((row) => ({
        monthKey: row.monthKey,
        monthLabel: formatThaiMonthLabel(row.monthKey),
        userId: row.userId,
        name: formatAdminName(row.userId, adminLookup, prefixMap),
        assignedSessions: row.assignedSessions,
        completedSessions: row.completedSessions,
        soapPending: row.soapPending,
        telemedPending: row.telemedPending,
        unreachable: row.unreachable,
        completionRate: calcCompletionRate(
          row.completedSessions,
          row.assignedSessions
        ),
      }))
      .sort(
        (a, b) =>
          b.monthKey.localeCompare(a.monthKey) ||
          b.completedSessions - a.completedSessions ||
          b.assignedSessions - a.assignedSessions
      ),
    monthlyTrend: Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([monthKey, values]) => ({
        monthKey,
        monthLabel: formatThaiMonthLabel(monthKey),
        assigned: values.assigned,
        completed: values.completed,
      })),
  };
}
