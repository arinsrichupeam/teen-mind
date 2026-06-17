"use client";

import type { OverviewResponse } from "@/lib/dashboard/overview";
import type { SchoolStat } from "@/app/api/dashboard/school-stats/route";

import { Suspense, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { ConsultTelemedCharts } from "./components/home/consult-telemed-charts";
import { CardUsageStats } from "./components/home/card-usage-stats";
import { CardSchoolStats } from "./components/home/card-school-stats";
import { DashboardDateFilterFab } from "./components/home/dashboard-date-filter-fab";
import { AssessmentWeekhourMonthlyHeatmap } from "./components/home/assessment-weekhour-monthly-heatmap";
import {
  ProblemStatsChart,
  type ProblemStat,
} from "./components/home/problem-stats-chart";
import {
  AdminDashboardPageSkeleton,
  DashboardChartAreaSkeleton,
  DashboardHeatmapSkeleton,
  DashboardUsageStatsSkeleton,
} from "./components/home/admin-dashboard-skeleton";

import Loading from "@/app/loading";
import { emptyOverviewResponse } from "@/lib/dashboard/overview";

// ---- fetchers ----

const fetchOverview = async (params?: {
  dateFrom?: string;
  dateTo?: string;
}): Promise<OverviewResponse> => {
  const search = new URLSearchParams();

  if (params?.dateFrom) search.set("dateFrom", params.dateFrom);
  if (params?.dateTo) search.set("dateTo", params.dateTo);
  const qs = search.toString() ? `?${search.toString()}` : "";
  const res = await fetch(`/api/dashboard/overview${qs}`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(
      res.status === 401 ? "Unauthorized" : "Failed to fetch overview"
    );
  }

  return res.json();
};

type UsageStatsRow = {
  yearBe: number;
  monthLabel: string;
  totalUse: number;
  totalUsers: number;
  male: number;
  female: number;
  unspecified: number;
  green: number;
  greenLow: number;
  yellow: number;
  orange: number;
  red: number;
};

const fetchUsageStats = async (): Promise<UsageStatsRow[]> => {
  const res = await fetch(`/api/dashboard/usage-stats`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(
      res.status === 401 ? "Unauthorized" : "Failed to fetch usage stats"
    );
  }
  const data = await res.json();

  return data.usageStats ?? [];
};

type AssessmentWeekhourMonthlyData = {
  monthLabel: string;
  weekdayLabels: string[];
  hourLabels: number[];
  cells: number[][];
  max: number;
  total: number;
};

const fetchAssessmentWeekhourMonthly = async (params?: {
  dateFrom?: string;
  dateTo?: string;
}): Promise<AssessmentWeekhourMonthlyData> => {
  const search = new URLSearchParams();

  if (params?.dateFrom) search.set("dateFrom", params.dateFrom);
  if (params?.dateTo) search.set("dateTo", params.dateTo);
  const qs = search.toString() ? `?${search.toString()}` : "";
  const res = await fetch(
    `/api/dashboard/usage-stats/assessment-weekhour-monthly${qs}`,
    { credentials: "include" }
  );

  if (!res.ok) {
    throw new Error(
      res.status === 401
        ? "Unauthorized"
        : "Failed to fetch assessment weekhour monthly"
    );
  }
  const data = await res.json();

  return {
    monthLabel: data.monthLabel ?? "",
    weekdayLabels: data.weekdayLabels ?? [],
    hourLabels: data.hourLabels ?? [],
    cells: data.cells ?? [],
    max: data.max ?? 0,
    total: data.total ?? 0,
  };
};

const fetchProblems = async (params?: {
  dateFrom?: string;
  dateTo?: string;
}): Promise<ProblemStat[]> => {
  const search = new URLSearchParams();

  if (params?.dateFrom) search.set("dateFrom", params.dateFrom);
  if (params?.dateTo) search.set("dateTo", params.dateTo);
  const qs = search.toString() ? `?${search.toString()}` : "";
  const res = await fetch(`/api/dashboard/problems${qs}`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(
      res.status === 401 ? "Unauthorized" : "Failed to fetch problems"
    );
  }
  const data = await res.json();

  return data.problems ?? [];
};

const fetchSchoolStats = async (params?: {
  dateFrom?: string;
  dateTo?: string;
}): Promise<{ schools: SchoolStat[]; summary: SchoolStat }> => {
  const search = new URLSearchParams();

  if (params?.dateFrom) search.set("dateFrom", params.dateFrom);
  if (params?.dateTo) search.set("dateTo", params.dateTo);
  const qs = search.toString() ? `?${search.toString()}` : "";
  const res = await fetch(`/api/dashboard/school-stats${qs}`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(
      res.status === 401 ? "Unauthorized" : "Failed to fetch school stats"
    );
  }

  return res.json();
};

// ---- page ----

export default function AdminHome() {
  const [dateRange, setDateRange] = useState<{
    start?: string;
    end?: string;
  }>({});

  const {
    data: overview = emptyOverviewResponse(),
    isLoading: isLoadingOverview,
  } = useQuery({
    queryKey: ["overview", dateRange.start, dateRange.end],
    queryFn: () =>
      fetchOverview({ dateFrom: dateRange.start, dateTo: dateRange.end }),
  });

  const { data: usageStats = [], isLoading: isLoadingUsage } = useQuery({
    queryKey: ["usage-stats"],
    queryFn: fetchUsageStats,
  });

  const {
    data: assessmentWeekhourMonthly = {
      monthLabel: "",
      weekdayLabels: [],
      hourLabels: [],
      cells: [],
      max: 0,
      total: 0,
    },
    isLoading: isLoadingWeekhourMonthly,
  } = useQuery({
    queryKey: ["assessment-weekhour-monthly", dateRange.start, dateRange.end],
    queryFn: () =>
      fetchAssessmentWeekhourMonthly({
        dateFrom: dateRange.start,
        dateTo: dateRange.end,
      }),
  });

  const { data: problems = [], isLoading: isLoadingProblems } = useQuery({
    queryKey: ["problems", dateRange.start, dateRange.end],
    queryFn: () =>
      fetchProblems({ dateFrom: dateRange.start, dateTo: dateRange.end }),
  });

  const {
    data: schoolStatsData = {
      schools: [],
      summary: {
        schoolName: "รวมทั้งหมด",
        total: 0,
        green: 0,
        greenLow: 0,
        yellow: 0,
        orange: 0,
        red: 0,
      },
    },
    isLoading: isLoadingSchool,
  } = useQuery({
    queryKey: ["school-stats", dateRange.start, dateRange.end],
    queryFn: () =>
      fetchSchoolStats({ dateFrom: dateRange.start, dateTo: dateRange.end }),
  });

  const isInitialDashboardLoading =
    isLoadingOverview || isLoadingUsage || isLoadingWeekhourMonthly;

  if (isInitialDashboardLoading) {
    return <AdminDashboardPageSkeleton />;
  }

  return (
    <Suspense fallback={<Loading />}>
      <div className="h-full lg:px-6">
        <div className="flex flex-col gap-6 pt-3 px-4 lg:px-0 sm:pt-10 max-w-[90rem] mx-auto w-full">
          <div className="flex flex-col gap-2">
            <h3 className="text-xl font-semibold">
              ภาพรวมการใช้บริการการประเมินสุขภาพจิต
            </h3>
            {isLoadingOverview ? (
              <DashboardChartAreaSkeleton chartClassName="min-h-[260px]" />
            ) : (
              <ConsultTelemedCharts
                age18AndOver={overview.age18AndOver}
                unclassifiedCount={overview.unclassifiedCount}
                under18={overview.under18}
              />
            )}
          </div>

          <div className="flex flex-col gap-2 mb-8">
            <h3 className="text-xl font-semibold">Heatmap เวลาทำแบบประเมิน</h3>
            {isLoadingWeekhourMonthly ? (
              <DashboardHeatmapSkeleton />
            ) : (
              <AssessmentWeekhourMonthlyHeatmap
                cells={assessmentWeekhourMonthly.cells}
                hourLabels={assessmentWeekhourMonthly.hourLabels}
                max={assessmentWeekhourMonthly.max}
                monthLabel={assessmentWeekhourMonthly.monthLabel}
                total={assessmentWeekhourMonthly.total}
                weekdayLabels={assessmentWeekhourMonthly.weekdayLabels}
              />
            )}
          </div>

          <div className="flex flex-col gap-2 mb-8">
            <h3 className="text-xl font-semibold">ปัญหาที่พบบ่อย</h3>
            {isLoadingProblems ? (
              <DashboardChartAreaSkeleton chartClassName="min-h-[400px]" />
            ) : (
              <ProblemStatsChart problems={problems} />
            )}
          </div>

          {schoolStatsData.schools.length > 0 && (
            <div className="flex flex-col gap-2 mb-8">
              <h3 className="text-xl font-semibold">ตารางสถิติรายโรงเรียน</h3>
              {isLoadingSchool ? (
                <DashboardChartAreaSkeleton chartClassName="min-h-[200px]" />
              ) : (
                <CardSchoolStats
                  data={schoolStatsData.schools}
                  summary={schoolStatsData.summary}
                />
              )}
            </div>
          )}

          <div className="flex flex-col gap-2 mb-8">
            <h3 className="text-xl font-semibold">ตารางสถิติการเข้าใช้งาน</h3>
            {isLoadingUsage ? (
              <DashboardUsageStatsSkeleton />
            ) : (
              <CardUsageStats data={usageStats} />
            )}
          </div>
        </div>

        <DashboardDateFilterFab value={dateRange} onChange={setDateRange} />
      </div>
    </Suspense>
  );
}
