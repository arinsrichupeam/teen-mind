"use client";

import { Suspense, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DateRangePicker } from "@heroui/react";
import { parseDate } from "@internationalized/date";

import { CardSchoolStats } from "./components/home/card-school-stats";
import { PieChartsSection } from "./components/home/pie-charts-section";
import { ConsultTelemedCharts } from "./components/home/consult-telemed-charts";
import { CardUsageStats } from "./components/home/card-usage-stats";
import { UsageRiskMonthlyChart } from "./components/home/usage-risk-monthly-chart";
import { Last7DaysUsageCards } from "./components/home/last-7-days-usage-cards";
import { AssessmentWeekhourMonthlyHeatmap } from "./components/home/assessment-weekhour-monthly-heatmap";

import Loading from "@/app/loading";
import { QuestionsData } from "@/types";
import { calculateAge } from "@/utils/helper";

const QUESTIONS_PAGE_LIMIT = 2000;
const CONCURRENT_PAGES = 5;

const fetchPage = async (page: number): Promise<QuestionsData[]> => {
  const res = await fetch(
    `/api/question?page=${page}&limit=${QUESTIONS_PAGE_LIMIT}`,
    { credentials: "include" }
  );

  if (!res.ok) {
    throw new Error(
      res.status === 401 ? "Unauthorized" : `Failed to fetch page ${page}`
    );
  }
  const data = await res.json();

  return data.questionsList ?? [];
};

const fetchQuestions = async (): Promise<QuestionsData[]> => {
  const firstRes = await fetch(
    `/api/question?page=1&limit=${QUESTIONS_PAGE_LIMIT}`,
    { credentials: "include" }
  );

  if (!firstRes.ok) {
    throw new Error(
      firstRes.status === 401 ? "Unauthorized" : "Failed to fetch questions"
    );
  }

  const firstData = await firstRes.json();
  const allQuestions: QuestionsData[] = [...(firstData.questionsList ?? [])];
  const pagination = firstData.pagination ?? { totalPages: 1 };

  if (pagination.totalPages <= 1) {
    return allQuestions;
  }

  const remainingPages = Array.from(
    { length: pagination.totalPages - 1 },
    (_, i) => i + 2
  );

  for (let i = 0; i < remainingPages.length; i += CONCURRENT_PAGES) {
    const batch = remainingPages.slice(i, i + CONCURRENT_PAGES);
    const batchResults = await Promise.all(batch.map(fetchPage));

    batchResults.forEach((list) => allQuestions.push(...list));
  }

  return allQuestions;
};

type UsageStatsRow = {
  yearBe: number;
  monthLabel: string;
  totalUse: number;
  totalUsers: number;
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

type Last7DayStat = {
  dayLabel: string;
  totalUse: number;
  totalUsers: number;
  green: number;
  greenLow: number;
  yellow: number;
  orange: number;
  red: number;
};

const fetchLast7Days = async (): Promise<Last7DayStat[]> => {
  const res = await fetch(`/api/dashboard/usage-stats/last-7-days`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(
      res.status === 401 ? "Unauthorized" : "Failed to fetch last 7 days"
    );
  }

  const data = await res.json();

  return data.last7Days ?? [];
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

  const res = await fetch(
    `/api/dashboard/usage-stats/assessment-weekhour-monthly${
      search.toString() ? `?${search.toString()}` : ""
    }`,
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

const filterLatestQuestions = (questions: QuestionsData[]) => {
  const latestQuestions: { [key: string]: QuestionsData } = {};

  questions.forEach((question) => {
    const profileId = question.profile.id;

    if (
      !latestQuestions[profileId] ||
      new Date(question.createdAt) >
        new Date(latestQuestions[profileId].createdAt)
    ) {
      latestQuestions[profileId] = question;
    }
  });

  return Object.values(latestQuestions);
};

// ฟังก์ชันกรองข้อมูลตามอายุ 12-18 ปี สำหรับสถิติ
const filterByAge = (
  data: QuestionsData[],
  ageRange: { min: number; max: number } = { min: 12, max: 18 }
) => {
  return data.filter((item) => {
    if (!item.profile?.birthday) return false;
    const school = item.profile.school;
    const screeningDate =
      typeof school === "object" && school !== null
        ? school.screeningDate
        : undefined;
    const age = calculateAge(item.profile.birthday, screeningDate);

    return age >= ageRange.min && age <= ageRange.max;
  });
};

export default function AdminHome() {
  const [riskRange, setRiskRange] = useState<{
    start?: string;
    end?: string;
  }>({});
  const [heatmapRange, setHeatmapRange] = useState<{
    start?: string;
    end?: string;
  }>({});

  const { data: rawQuestions = [], isLoading: isLoadingQuestions } = useQuery({
    queryKey: ["questions"],
    queryFn: fetchQuestions,
  });

  const { data: usageStats = [], isLoading: isLoadingUsage } = useQuery({
    queryKey: ["usage-stats"],
    queryFn: fetchUsageStats,
  });

  const { data: last7Days = [], isLoading: isLoadingLast7Days } = useQuery({
    queryKey: ["last-7-days-usage"],
    queryFn: fetchLast7Days,
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
    queryKey: [
      "assessment-weekhour-monthly",
      heatmapRange.start,
      heatmapRange.end,
    ],
    queryFn: () =>
      fetchAssessmentWeekhourMonthly({
        dateFrom: heatmapRange.start,
        dateTo: heatmapRange.end,
      }),
  });

  const fetchRiskSummary = async (params?: {
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const search = new URLSearchParams();

    if (params?.dateFrom) search.set("dateFrom", params.dateFrom);
    if (params?.dateTo) search.set("dateTo", params.dateTo);

    const res = await fetch(
      `/api/dashboard/usage-stats/risk-summary${
        search.toString() ? `?${search.toString()}` : ""
      }`,
      { credentials: "include" }
    );

    if (!res.ok) {
      throw new Error(
        res.status === 401 ? "Unauthorized" : "Failed to fetch risk summary"
      );
    }

    return res.json() as Promise<{
      label: string | null;
      totalUsers: number;
      green: number;
      greenLow: number;
      yellow: number;
      orange: number;
      red: number;
    }>;
  };

  const { data: riskSummary, isLoading: isLoadingRiskSummary } = useQuery({
    queryKey: ["risk-summary", riskRange.start, riskRange.end],
    queryFn: () =>
      fetchRiskSummary({
        dateFrom: riskRange.start,
        dateTo: riskRange.end,
      }),
  });

  type SchoolStat = {
    schoolName: string;
    total: number;
    green: number;
    greenLow: number;
    yellow: number;
    orange: number;
    red: number;
  };

  // useMemo ลดการคำนวณซ้ำเมื่อ rawQuestions ไม่เปลี่ยน (rerender-memo)
  const filteredQuestions = useMemo(
    () => filterByAge(rawQuestions),
    [rawQuestions]
  );

  const filteredLatestQuestions = useMemo(
    () => filterLatestQuestions(filteredQuestions),
    [filteredQuestions]
  );

  const schoolStats = useMemo(
    () =>
      Object.values(
        filteredLatestQuestions.reduce((acc: Record<string, SchoolStat>, q) => {
          let schoolName: string;

          if (
            typeof q.profile.school === "object" &&
            q.profile.school !== null
          ) {
            schoolName =
              (q.profile.school as { name?: string }).name || "ไม่ระบุโรงเรียน";
          } else {
            schoolName = (q.profile.school as string) || "ไม่ระบุโรงเรียน";
          }

          if (!acc[schoolName]) {
            acc[schoolName] = {
              schoolName,
              total: 0,
              green: 0,
              greenLow: 0,
              yellow: 0,
              orange: 0,
              red: 0,
            };
          }
          acc[schoolName].total++;
          if (q.result === "Green") acc[schoolName].green++;
          if (q.result === "Green-Low") acc[schoolName].greenLow++;
          if (q.result === "Yellow") acc[schoolName].yellow++;
          if (q.result === "Orange") acc[schoolName].orange++;
          if (q.result === "Red") acc[schoolName].red++;

          return acc;
        }, {})
      ),
    [filteredLatestQuestions]
  );

  const schoolStatsSummary = useMemo(
    () =>
      schoolStats.reduce(
        (acc, school) => {
          acc.total += school.total;
          acc.green += school.green;
          acc.greenLow += school.greenLow;
          acc.yellow += school.yellow;
          acc.orange += school.orange;
          acc.red += school.red;

          return acc;
        },
        {
          schoolName: "Total",
          total: 0,
          green: 0,
          greenLow: 0,
          yellow: 0,
          orange: 0,
          red: 0,
        } as SchoolStat
      ),
    [schoolStats]
  );

  if (
    isLoadingQuestions &&
    isLoadingUsage &&
    isLoadingLast7Days &&
    isLoadingWeekhourMonthly
  ) {
    return <></>;
  }

  return (
    <Suspense fallback={<Loading />}>
      <div className="h-full lg:px-6">
        <div className="flex flex-col gap-6 pt-3 px-4 lg:px-0 sm:pt-10 max-w-[90rem] mx-auto w-full">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2">
              <h3 className="text-xl font-semibold">
                ผลการพบนักจิตวิทยา (อายุ 12-18 ปี)
              </h3>
              <ConsultTelemedCharts questions={filteredLatestQuestions} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2">
              <h3 className="text-xl font-semibold">
                กราฟแสดงผลการประเมิน (อายุ 12-18 ปี)
              </h3>
              <PieChartsSection data={filteredLatestQuestions} />
            </div>
          </div>

          <div className="flex flex-col gap-2 mb-8">
            <div className="flex flex-col gap-2">
              <h3 className="text-xl font-semibold">ตารางสถิติรายโรงเรียน</h3>
              <CardSchoolStats
                data={schoolStats}
                summary={schoolStatsSummary}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 mb-8">
            <div className="flex flex-col gap-2">
              <h3 className="text-xl font-semibold">
                กราฟสถิติการเข้าใช้งานตามระดับความเสี่ยง
              </h3>
              <div className="max-w-md">
                <DateRangePicker
                  label="เลือกช่วงวันที่"
                  value={
                    riskRange.start && riskRange.end
                      ? {
                          start: parseDate(riskRange.start),
                          end: parseDate(riskRange.end),
                        }
                      : null
                  }
                  onChange={(range) => {
                    if (!range) {
                      setRiskRange({});

                      return;
                    }
                    setRiskRange({
                      start: range.start?.toString(),
                      end: range.end?.toString(),
                    });
                  }}
                />
              </div>
              {isLoadingRiskSummary ? (
                <div className="text-sm text-default-500">กำลังโหลด...</div>
              ) : riskSummary ? (
                <UsageRiskMonthlyChart summary={riskSummary} />
              ) : (
                <div className="text-sm text-default-500">ไม่พบข้อมูล</div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 mb-8">
            <div className="flex flex-col gap-2">
              <h3 className="text-xl font-semibold">
                Heatmap เวลาเมื่อทำแบบประเมิน
              </h3>
              <div className="max-w-md">
                <DateRangePicker
                  label="เลือกช่วงวันที่"
                  value={
                    heatmapRange.start && heatmapRange.end
                      ? {
                          start: parseDate(heatmapRange.start),
                          end: parseDate(heatmapRange.end),
                        }
                      : null
                  }
                  onChange={(range) => {
                    if (!range) {
                      setHeatmapRange({});

                      return;
                    }
                    setHeatmapRange({
                      start: range.start?.toString(),
                      end: range.end?.toString(),
                    });
                  }}
                />
              </div>
              {isLoadingWeekhourMonthly ? (
                <div className="text-sm text-default-500">กำลังโหลด...</div>
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
          </div>

          <div className="flex flex-col gap-2 mb-8">
            <div className="flex flex-col gap-2">
              <h3 className="text-xl font-semibold">สถิติ 5 วันล่าสุด</h3>
              {isLoadingLast7Days ? (
                <div className="text-sm text-default-500">กำลังโหลด...</div>
              ) : (
                <Last7DaysUsageCards data={last7Days} />
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 mb-8">
            <div className="flex flex-col gap-2">
              <h3 className="text-xl font-semibold">ตารางสถิติการเข้าใช้งาน</h3>
              {isLoadingUsage ? (
                <div className="text-sm text-default-500">กำลังโหลด...</div>
              ) : (
                <CardUsageStats data={usageStats} />
              )}
            </div>
          </div>
        </div>
      </div>
    </Suspense>
  );
}
