import type { QuestionsData } from "@/types";

import {
  formatThaiMonthLabel,
  toThailandMonthKey,
} from "@/lib/dashboard/parse-dashboard-date";
import {
  CONSULT_TELEMED_ROUNDS,
  isConsultTelemedRoundComplete,
  isDischargeSoapRoundComplete,
} from "@/lib/question-followup-rounds";

export type PsychologistMonthlyDetailRow = {
  monthKey: string;
  monthLabel: string;
  userId: string;
  name: string;
  assignedSessions: number;
  completedSessions: number;
  soapPending: number;
  telemedPending: number;
  completionRate: number;
};

export type PsychologistProductivityRow = {
  userId: string;
  name: string;
  activeCases: number;
  assignedSessions: number;
  completedSessions: number;
  soapPending: number;
  telemedPending: number;
  completionRate: number;
};

export type MonthlyProductivityPoint = {
  monthKey: string;
  monthLabel: string;
  assigned: number;
  completed: number;
};

export type PsychologistProductivityStats = {
  label: string | null;
  summary: {
    activePsychologists: number;
    totalActiveCases: number;
    totalAssignedSessions: number;
    totalCompletedSessions: number;
    overallCompletionRate: number;
    soapPending: number;
    telemedPending: number;
  };
  psychologists: PsychologistProductivityRow[];
  psychologistMonthly: PsychologistMonthlyDetailRow[];
  monthlyTrend: MonthlyProductivityPoint[];
};

type SessionRecord = {
  userId: string;
  questionId: string;
  profileId: string;
  round: 1 | 2 | 3;
  sessionDate: Date | null;
  questionCreatedAt: Date;
  consultTelemedComplete: boolean;
  dischargeSoapComplete: boolean;
  roundComplete: boolean;
};

export type QuestionLike = {
  id: string;
  profileId: string;
  createdAt: Date | string;
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
};

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

const toDate = (value: Date | string) =>
  value instanceof Date ? value : new Date(value);

const extractSessions = (questions: QuestionLike[]): SessionRecord[] => {
  const sessions: SessionRecord[] = [];

  for (const question of questions) {
    const qData = toQuestionData(question);
    const createdAt = toDate(question.createdAt);

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

      const consultTelemedComplete = isConsultTelemedRoundComplete(
        qData,
        roundIndex as 0 | 1 | 2
      );
      const dischargeSoapComplete = isDischargeSoapRoundComplete(
        qData,
        roundIndex as 0 | 1 | 2
      );

      sessions.push({
        userId,
        questionId: question.id,
        profileId: question.profileId,
        round: (roundIndex + 1) as 1 | 2 | 3,
        sessionDate,
        questionCreatedAt: createdAt,
        consultTelemedComplete,
        dischargeSoapComplete,
        roundComplete: consultTelemedComplete && dischargeSoapComplete,
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

export function emptyPsychologistProductivityStats(
  label: string | null = "ข้อมูลทั้งหมด"
): PsychologistProductivityStats {
  return {
    label,
    summary: {
      activePsychologists: 0,
      totalActiveCases: 0,
      totalAssignedSessions: 0,
      totalCompletedSessions: 0,
      overallCompletionRate: 0,
      soapPending: 0,
      telemedPending: 0,
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
  const allSessions = extractSessions(questions);
  const sessions = dateRange
    ? allSessions.filter((s) =>
        sessionInDateRange(s, dateRange.startUtc, dateRange.endUtc)
      )
    : allSessions;

  if (sessions.length === 0) {
    return emptyPsychologistProductivityStats(label);
  }

  const byPsychologist = new Map<
    string,
    {
      caseIds: Set<string>;
      assignedSessions: number;
      completedSessions: number;
      soapPending: number;
      telemedPending: number;
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
    }
  >();

  for (const session of sessions) {
    const bucket = byPsychologist.get(session.userId) ?? {
      caseIds: new Set<string>(),
      assignedSessions: 0,
      completedSessions: 0,
      soapPending: 0,
      telemedPending: 0,
    };

    bucket.caseIds.add(session.questionId);
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
    };

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

    psychologistMonthMap.set(monthPsychKey, monthPsychBucket);

    const monthBucket = monthlyMap.get(monthKey) ?? {
      assigned: 0,
      completed: 0,
    };

    monthBucket.assigned += 1;
    if (session.roundComplete) monthBucket.completed += 1;
    monthlyMap.set(monthKey, monthBucket);
  }

  const psychologists: PsychologistProductivityRow[] = Array.from(
    byPsychologist.entries()
  )
    .map(([userId, stats]) => ({
      userId,
      name: formatAdminName(userId, adminLookup, prefixMap),
      activeCases: stats.caseIds.size,
      assignedSessions: stats.assignedSessions,
      completedSessions: stats.completedSessions,
      soapPending: stats.soapPending,
      telemedPending: stats.telemedPending,
      completionRate: calcCompletionRate(
        stats.completedSessions,
        stats.assignedSessions
      ),
    }))
    .sort(
      (a, b) =>
        b.completedSessions - a.completedSessions ||
        b.assignedSessions - a.assignedSessions
    );

  const summaryAssigned = sessions.length;
  const summaryCompleted = sessions.filter((s) => s.roundComplete).length;
  const uniqueCases = new Set(sessions.map((s) => s.questionId));

  return {
    label,
    summary: {
      activePsychologists: psychologists.length,
      totalActiveCases: uniqueCases.size,
      totalAssignedSessions: summaryAssigned,
      totalCompletedSessions: summaryCompleted,
      overallCompletionRate: calcCompletionRate(
        summaryCompleted,
        summaryAssigned
      ),
      soapPending: psychologists.reduce((sum, p) => sum + p.soapPending, 0),
      telemedPending: psychologists.reduce(
        (sum, p) => sum + p.telemedPending,
        0
      ),
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
