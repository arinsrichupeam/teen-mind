"use client";

import { Suspense, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { ConsultTelemedCharts } from "./components/home/consult-telemed-charts";
import { CardUsageStats } from "./components/home/card-usage-stats";
import { DashboardDateFilterFab } from "./components/home/dashboard-date-filter-fab";
import { AssessmentWeekhourMonthlyHeatmap } from "./components/home/assessment-weekhour-monthly-heatmap";
// import { PieChartsSection } from "./components/home/pie-charts-section";
// import { CardSchoolStats } from "./components/home/card-school-stats";
import {
  AdminDashboardPageSkeleton,
  DashboardChartAreaSkeleton,
  DashboardHeatmapSkeleton,
  DashboardUsageStatsSkeleton,
} from "./components/home/admin-dashboard-skeleton";

import Loading from "@/app/loading";
import {
  parseDateParam,
  thaiDateRangeToUtc,
} from "@/lib/dashboard/parse-dashboard-date";
import { calculateQuestionStatus } from "@/lib/question-followup-rounds";
import { QuestionsData } from "@/types";

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

const filterQuestionsByDateRange = (
  questions: QuestionsData[],
  start?: string,
  end?: string
) => {
  if (!start || !end) return questions;

  const parsedFrom = parseDateParam(start);
  const parsedTo = parseDateParam(end);

  if (!parsedFrom || !parsedTo) return questions;

  const { startUtc, endUtc } = thaiDateRangeToUtc(parsedFrom, parsedTo);

  return questions.filter((q) => {
    const created = new Date(q.createdAt);

    return created >= startUtc && created < endUtc;
  });
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
// const filterByAge = (
//   data: QuestionsData[],
//   ageRange: { min: number; max: number } = { min: 12, max: 18 }
// ) => {
//   return data.filter((item) => {
//     if (!item.profile?.birthday) return false;
//     const school = item.profile.school;
//     const screeningDate =
//       typeof school === "object" && school !== null
//         ? school.screeningDate
//         : undefined;
//     const age = calculateAge(item.profile.birthday, screeningDate);

//     return age >= ageRange.min && age <= ageRange.max;
//   });
// };

export default function AdminHome() {
  const [dateRange, setDateRange] = useState<{
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

  // type SchoolStat = {
  //   schoolName: string;
  //   total: number;
  //   green: number;
  //   greenLow: number;
  //   yellow: number;
  //   orange: number;
  //   red: number;
  // };

  // useMemo ลดการคำนวณซ้ำเมื่อ rawQuestions ไม่เปลี่ยน (rerender-memo)
  // const filteredQuestions = useMemo(
  //   () => filterByAge(rawQuestions),
  //   [rawQuestions]
  // );

  // const filteredLatestQuestions = useMemo(
  //   () => filterLatestQuestions(filteredQuestions),
  //   [filteredQuestions]
  // );

  /** รายการประเมินล่าสุดต่อคนในช่วงเวลาที่เลือก — ใช้กับ ConsultTelemedCharts */
  const latestQuestionsAllAges = useMemo(() => {
    const inRange = filterQuestionsByDateRange(
      rawQuestions,
      dateRange.start,
      dateRange.end
    );

    return filterLatestQuestions(inRange);
  }, [rawQuestions, dateRange.start, dateRange.end]);

  /** คำนวณสถานะจากข้อมูลนัด/คำปรึกษา/SOAP แทนค่า status ในฐานข้อมูล */
  const latestQuestionsWithStatus = useMemo(
    () =>
      latestQuestionsAllAges.map((q) => ({
        ...q,
        status: calculateQuestionStatus(q),
      })),
    [latestQuestionsAllAges]
  );

  // const schoolStats = useMemo(
  //   () =>
  //     Object.values(
  //       filteredLatestQuestions.reduce((acc: Record<string, SchoolStat>, q) => {
  //         let schoolName: string;

  //         if (
  //           typeof q.profile.school === "object" &&
  //           q.profile.school !== null
  //         ) {
  //           schoolName =
  //             (q.profile.school as { name?: string }).name || "ไม่ระบุโรงเรียน";
  //         } else {
  //           schoolName = (q.profile.school as string) || "ไม่ระบุโรงเรียน";
  //         }

  //         if (!acc[schoolName]) {
  //           acc[schoolName] = {
  //             schoolName,
  //             total: 0,
  //             green: 0,
  //             greenLow: 0,
  //             yellow: 0,
  //             orange: 0,
  //             red: 0,
  //           };
  //         }
  //         acc[schoolName].total++;
  //         if (q.result === "Green") acc[schoolName].green++;
  //         if (q.result === "Green-Low") acc[schoolName].greenLow++;
  //         if (q.result === "Yellow") acc[schoolName].yellow++;
  //         if (q.result === "Orange") acc[schoolName].orange++;
  //         if (q.result === "Red") acc[schoolName].red++;

  //         return acc;
  //       }, {})
  //     ),
  //   [filteredLatestQuestions]
  // );

  // const schoolStatsSummary = useMemo(
  //   () =>
  //     schoolStats.reduce(
  //       (acc, school) => {
  //         acc.total += school.total;
  //         acc.green += school.green;
  //         acc.greenLow += school.greenLow;
  //         acc.yellow += school.yellow;
  //         acc.orange += school.orange;
  //         acc.red += school.red;

  //         return acc;
  //       },
  //       {
  //         schoolName: "Total",
  //         total: 0,
  //         green: 0,
  //         greenLow: 0,
  //         yellow: 0,
  //         orange: 0,
  //         red: 0,
  //       } as SchoolStat
  //     ),
  //   [schoolStats]
  // );

  const isInitialDashboardLoading =
    isLoadingQuestions || isLoadingUsage || isLoadingWeekhourMonthly;

  if (isInitialDashboardLoading) {
    return <AdminDashboardPageSkeleton />;
  }

  return (
    <Suspense fallback={<Loading />}>
      <div className="h-full lg:px-6">
        <div className="flex flex-col gap-6 pt-3 px-4 lg:px-0 sm:pt-10 max-w-[90rem] mx-auto w-full">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2">
              <h3 className="text-xl font-semibold">
                ผลการพบนักจิตวิทยา (แยกอายุต่ำกว่า 18 ปี และ 18 ปีขึ้นไป)
              </h3>
              {isLoadingQuestions ? (
                <DashboardChartAreaSkeleton chartClassName="min-h-[260px]" />
              ) : (
                <ConsultTelemedCharts questions={latestQuestionsWithStatus} />
              )}
            </div>
          </div>

          {/* <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2">
              <h3 className="text-xl font-semibold">
                กราฟแสดงผลการประเมิน (อายุ 12-18 ปี)
              </h3>
              <PieChartsSection data={filteredLatestQuestions} />
            </div>
          </div> */}

          {/* <div className="flex flex-col gap-2 mb-8">
            <div className="flex flex-col gap-2">
              <h3 className="text-xl font-semibold">ตารางสถิติรายโรงเรียน</h3>
              <CardSchoolStats
                data={schoolStats}
                summary={schoolStatsSummary}
              />
            </div>
          </div> */}

          <div className="flex flex-col gap-2 mb-8">
            <div className="flex flex-col gap-2">
              <h3 className="text-xl font-semibold">
                Heatmap เวลาเมื่อทำแบบประเมิน
              </h3>
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
          </div>

          <div className="flex flex-col gap-2 mb-8">
            <div className="flex flex-col gap-2">
              <h3 className="text-xl font-semibold">ตารางสถิติการเข้าใช้งาน</h3>
              {isLoadingUsage ? (
                <DashboardUsageStatsSkeleton />
              ) : (
                <CardUsageStats data={usageStats} />
              )}
            </div>
          </div>
        </div>

        <DashboardDateFilterFab value={dateRange} onChange={setDateRange} />
      </div>
    </Suspense>
  );
}
