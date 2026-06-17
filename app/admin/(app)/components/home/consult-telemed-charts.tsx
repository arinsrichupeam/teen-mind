"use client";

import type {
  OverviewAgeGroup,
  OverviewConsultStats,
} from "@/lib/dashboard/overview";

import { AgeSegmentRiskChart } from "../age-segment/age-segment-risk-chart";

const formatNumber = (value: number) => value.toLocaleString("th-TH");

function CohortAtAGlanceCard({
  stats,
  subtitle,
  title,
  variant,
}: {
  stats: OverviewConsultStats;
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
          <div className="mt-1 flex justify-end gap-2 text-xs">
            <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-blue-700">
              <svg
                className="h-3 w-3"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M9 2a5 5 0 1 0 0 10A5 5 0 0 0 9 2zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm8-2v2h2v2h-2v2h-2V6h-2V4h2V2h2zm-8 10c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z" />
              </svg>
              <span className="font-semibold">
                {formatNumber(stats.gender.male)}
              </span>
            </span>
            <span className="flex items-center gap-1 rounded-full bg-pink-100 px-2 py-0.5 text-pink-600">
              <svg
                className="h-3 w-3"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 2a5 5 0 1 0 0 10A5 5 0 0 0 12 2zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm-5 11c0-1.33 2.67-4 5-4a7.2 7.2 0 0 1 1.43.15A3.49 3.49 0 0 0 13 14.5V16H7v-1zM13 14.5a2.5 2.5 0 0 1 5 0V15h-1v5h-3v-5h-1v-.5z" />
              </svg>
              <span className="font-semibold">
                {formatNumber(stats.gender.female)}
              </span>
            </span>
            {stats.gender.other > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-default-100 px-2 py-0.5 text-default-500">
                <svg
                  className="h-3 w-3"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 2a5 5 0 1 0 0 10A5 5 0 0 0 12 2zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm0 10c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z" />
                </svg>
                <span className="font-semibold">
                  {formatNumber(stats.gender.other)}
                </span>
              </span>
            )}
          </div>
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

interface ConsultTelemedChartsProps {
  under18: OverviewAgeGroup;
  age18AndOver: OverviewAgeGroup;
  unclassifiedCount: number;
}

export function ConsultTelemedCharts({
  under18,
  age18AndOver,
  unclassifiedCount,
}: ConsultTelemedChartsProps) {
  const totalAll = under18.stats.total + age18AndOver.stats.total;

  if (totalAll === 0 && unclassifiedCount === 0) {
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
          stats={under18.stats}
          subtitle="สรุปสถานะการติดตามจากผู้ประเมินล่าสุดต่อคน"
          title="อายุต่ำกว่า 18 ปี"
          variant="teen"
        />
        <CohortAtAGlanceCard
          stats={age18AndOver.stats}
          subtitle="สรุปสถานะการติดตามจากผู้ประเมินล่าสุดต่อคน"
          title="อายุ 18 ปีขึ้นไป"
          variant="adult"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AgeSegmentRiskChart
          assessmentScale="phqa"
          risk={under18.risk}
          subtitle="เกณฑ์ผลการประเมินตามความเสี่ยง — PHQ-A"
          title="ผลการประเมินตามความเสี่ยง — อายุต่ำกว่า 18 ปี"
        />
        <AgeSegmentRiskChart
          assessmentScale="9q"
          risk={age18AndOver.risk}
          subtitle="เกณฑ์ผลการประเมินตามความเสี่ยง — 9Q"
          title="ผลการประเมินตามความเสี่ยง — อายุ 18 ปีขึ้นไป"
        />
      </div>
    </div>
  );
}
