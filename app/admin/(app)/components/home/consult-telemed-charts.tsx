"use client";

import { useMemo } from "react";

import { AgeSegmentRiskChart } from "../age-segment/age-segment-risk-chart";

import { calculateQuestionStatus } from "@/lib/question-followup-rounds";
import {
  getRiskCounts,
  type RiskByAgeGroup,
} from "@/lib/dashboard/age-segment";
import {
  MAIN_ASSESSMENT_AGE_CUTOFF,
  getMainAssessmentScaleFromAge,
  getMainSumFromQuestion,
} from "@/lib/assessment-scale";
import { QuestionsData } from "@/types";
import {
  calculateAge,
  getNineQRiskLevel,
  getPhqaRiskLevel,
} from "@/utils/helper";

interface ConsultTelemedChartsProps {
  questions: QuestionsData[];
}

type ConsultTelemedStats = {
  total: number;
  consult: {
    /** เสร็จสิ้น — status === 3 */
    completed: number;
    /** รอสรุปผลการให้คำปรึกษา — status === 2 */
    awaitingSummary: number;
    /** รอให้คำปรึกษา — status === 1 */
    awaitingConsult: number;
    /** รอระบุ HN — status === 0 */
    awaitingHn: number;
  };
};

const formatNumber = (value: number) => value.toLocaleString("th-TH");

function getScreeningDateForAge(q: QuestionsData): string | Date | undefined {
  const school = q.profile?.school;

  if (typeof school === "object" && school !== null) {
    return school.screeningDate ?? undefined;
  }

  return undefined;
}

function getAgeYearsForQuestion(q: QuestionsData): number | null {
  if (!q.profile?.birthday) return null;

  const age = calculateAge(q.profile.birthday, getScreeningDateForAge(q));

  return age;
}

function isAgeUnder18(q: QuestionsData): boolean {
  const age = getAgeYearsForQuestion(q);

  return age !== null && age < MAIN_ASSESSMENT_AGE_CUTOFF;
}

function isAge18AndOver(q: QuestionsData): boolean {
  const age = getAgeYearsForQuestion(q);

  return age !== null && age >= MAIN_ASSESSMENT_AGE_CUTOFF;
}

function getMainSumFromQuestionData(q: QuestionsData): number | null {
  return getMainSumFromQuestion(q.q9?.[0]?.sum, q.phqa?.[0]?.sum);
}

function buildConsultTelemedStats(
  filteredQuestions: QuestionsData[]
): ConsultTelemedStats {
  const statusOf = (q: QuestionsData) => calculateQuestionStatus(q);

  return {
    total: filteredQuestions.length,
    consult: {
      completed: filteredQuestions.filter((q) => statusOf(q) === 3).length,
      awaitingSummary: filteredQuestions.filter((q) => statusOf(q) === 2)
        .length,
      awaitingConsult: filteredQuestions.filter((q) => statusOf(q) === 1)
        .length,
      awaitingHn: filteredQuestions.filter((q) => statusOf(q) === 0).length,
    },
  };
}

function buildRiskFromQuestions(questions: QuestionsData[]): RiskByAgeGroup {
  const risk: RiskByAgeGroup = {
    green: 0,
    greenLow: 0,
    yellow: 0,
    orange: 0,
    red: 0,
    totalUsers: 0,
  };

  for (const q of questions) {
    const age = getAgeYearsForQuestion(q);
    const mainSum = getMainSumFromQuestionData(q);

    if (age === null || mainSum === null || Number.isNaN(mainSum)) continue;

    const scale = getMainAssessmentScaleFromAge(age);
    const resultLevel =
      scale === "9Q" ? getNineQRiskLevel(mainSum) : getPhqaRiskLevel(mainSum);
    const normalized =
      scale === "9Q" && resultLevel === "Green-Low" ? "Green" : resultLevel;
    const c = getRiskCounts(normalized);

    risk.green += c.green;
    risk.greenLow += c.greenLow;
    risk.yellow += c.yellow;
    risk.orange += c.orange;
    risk.red += c.red;
    risk.totalUsers += 1;
  }

  return risk;
}

function CohortAtAGlanceCard({
  stats,
  subtitle,
  title,
  variant,
}: {
  stats: ConsultTelemedStats;
  subtitle: string;
  title: string;
  variant: "teen" | "adult";
}) {
  const borderClass =
    variant === "teen"
      ? "border-sky-200/80 bg-sky-50/40"
      : "border-violet-200/80 bg-violet-50/40";

  const metrics = [
    {
      label: "เสร็จสิ้น",
      value: stats.consult.completed,
      valueClass: "text-success-600",
    },
    {
      label: "รอสรุปผลการให้คำปรึกษา",
      value: stats.consult.awaitingSummary,
      valueClass: "text-warning-600",
    },
    {
      label: "รอให้คำปรึกษา",
      value: stats.consult.awaitingConsult,
      valueClass: "text-primary-600",
    },
    {
      label: "รอระบุ HN",
      value: stats.consult.awaitingHn,
      valueClass: "text-default-600",
    },
  ] as const;

  return (
    <div className={`rounded-2xl border p-4 sm:p-5 shadow-sm ${borderClass}`}>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-default-700">{title}</p>
          <p className="text-xs text-default-500">{subtitle}</p>
        </div>
        <div className="mt-2 text-right sm:mt-0">
          <p className="text-xs text-default-500">ผู้ประเมินทั้งหมด</p>
          <p className="text-3xl font-bold tabular-nums tracking-tight text-default-900">
            {formatNumber(stats.total)}
          </p>
        </div>
      </div>

      <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {metrics.map((m) => (
          <li
            key={m.label}
            className="flex flex-col rounded-xl border border-white/80 bg-white/90 px-3 py-2.5 shadow-sm"
          >
            <span className="text-xs leading-snug text-default-600">
              {m.label}
            </span>
            <span
              className={`mt-1 text-xl font-semibold tabular-nums ${m.valueClass}`}
            >
              {formatNumber(m.value)}
              <span className="ml-1 text-xs font-normal text-default-500">
                ราย
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ConsultTelemedCharts({ questions }: ConsultTelemedChartsProps) {
  const { under18Questions, age18AndOverQuestions, unclassifiedCount } =
    useMemo(() => {
      const under18: QuestionsData[] = [];
      const age18AndOver: QuestionsData[] = [];
      let other = 0;

      for (const q of questions) {
        if (isAgeUnder18(q)) under18.push(q);
        else if (isAge18AndOver(q)) age18AndOver.push(q);
        else other++;
      }

      return {
        under18Questions: under18,
        age18AndOverQuestions: age18AndOver,
        unclassifiedCount: other,
      };
    }, [questions]);

  const under18Stats = useMemo(
    () => buildConsultTelemedStats(under18Questions),
    [under18Questions]
  );
  const age18AndOverStats = useMemo(
    () => buildConsultTelemedStats(age18AndOverQuestions),
    [age18AndOverQuestions]
  );

  const under18Risk = useMemo(
    () => buildRiskFromQuestions(under18Questions),
    [under18Questions]
  );
  const age18AndOverRisk = useMemo(
    () => buildRiskFromQuestions(age18AndOverQuestions),
    [age18AndOverQuestions]
  );

  if (!questions || questions.length === 0) {
    return (
      <div className="text-center text-gray-500">
        ไม่มีข้อมูลการเข้าพบนักจิตวิทยา
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {unclassifiedCount > 0 && (
        <p className="rounded-lg border border-default-200 bg-default-50 px-3 py-2 text-center text-xs text-default-600">
          {`หมายเหตุ: มี ${formatNumber(unclassifiedCount)} รายที่ไม่มีวันเกิด จึงไม่รวมในสรุปด้านล่าง`}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CohortAtAGlanceCard
          stats={under18Stats}
          subtitle="สรุปสถานะการติดตามจากผู้ประเมินล่าสุดต่อคน"
          title="อายุต่ำกว่า 18 ปี"
          variant="teen"
        />
        <CohortAtAGlanceCard
          stats={age18AndOverStats}
          subtitle="สรุปสถานะการติดตามจากผู้ประเมินล่าสุดต่อคน"
          title="อายุ 18 ปีขึ้นไป"
          variant="adult"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AgeSegmentRiskChart
          assessmentScale="phqa"
          risk={under18Risk}
          subtitle="เกณฑ์ผลการประเมินตามความเสี่ยง — PHQ-A"
          title="ผลการประเมินตามความเสี่ยง — อายุต่ำกว่า 18 ปี"
        />
        <AgeSegmentRiskChart
          assessmentScale="9q"
          risk={age18AndOverRisk}
          subtitle="เกณฑ์ผลการประเมินตามความเสี่ยง — 9Q"
          title="ผลการประเมินตามความเสี่ยง — อายุ 18 ปีขึ้นไป"
        />
      </div>
    </div>
  );
}
