"use client";

import type { PsychologistProductivityStats } from "@/lib/dashboard/psychologist-productivity";

import { Suspense, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { DashboardDateFilterFab } from "../components/home/dashboard-date-filter-fab";
import { DashboardProductivitySkeleton } from "../components/dashboard-productivity/dashboard-productivity-skeleton";
import { ProductivityCharts } from "../components/dashboard-productivity/productivity-charts";
import { ProductivityPsychologistTable } from "../components/dashboard-productivity/productivity-psychologist-table";
import { ProductivitySummaryCards } from "../components/dashboard-productivity/productivity-summary-cards";

import Loading from "@/app/loading";

const fetchPsychologistProductivity = async (params?: {
  dateFrom?: string;
  dateTo?: string;
}): Promise<PsychologistProductivityStats> => {
  const search = new URLSearchParams();

  if (params?.dateFrom) search.set("dateFrom", params.dateFrom);
  if (params?.dateTo) search.set("dateTo", params.dateTo);

  const url = `/api/dashboard/psychologist-productivity${
    search.toString() ? `?${search.toString()}` : ""
  }`;

  const res = await fetch(url, { credentials: "include" });

  if (!res.ok) {
    throw new Error(
      res.status === 401
        ? "Unauthorized"
        : "Failed to fetch psychologist productivity"
    );
  }

  return res.json();
};

export default function PsychologistProductivityDashboardPage() {
  const [dateRange, setDateRange] = useState<{
    start?: string;
    end?: string;
  }>({});

  const { data, isLoading } = useQuery({
    queryKey: ["psychologist-productivity", dateRange.start, dateRange.end],
    queryFn: () =>
      fetchPsychologistProductivity({
        dateFrom: dateRange.start,
        dateTo: dateRange.end,
      }),
  });

  if (isLoading) {
    return <DashboardProductivitySkeleton />;
  }

  if (!data) {
    return <div className="p-8 text-center text-default-500">ไม่พบข้อมูล</div>;
  }

  return (
    <Suspense fallback={<Loading />}>
      <div className="h-full lg:px-6">
        <div className="flex flex-col gap-4 pt-2 pb-12 px-4 lg:px-0 sm:pt-10 sm:pb-28 max-w-[90rem] mx-auto w-full">
          <header className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold">
              ประสิทธิภาพการทำงานของนักจิตวิทยา
            </h1>
          </header>

          <section className="flex flex-col gap-2">
            <ProductivitySummaryCards summary={data.summary} />
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">กราฟเปรียบเทียบ</h2>
            <ProductivityCharts
              monthlyTrend={data.monthlyTrend}
              psychologists={data.psychologists}
            />
          </section>

          <section className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold">
                รายละเอียดรายนักจิตวิทยา
              </h2>
            </div>
            <ProductivityPsychologistTable
              periodLabel={data.label}
              rows={data.psychologists}
            />
          </section>
        </div>

        <DashboardDateFilterFab value={dateRange} onChange={setDateRange} />
      </div>
    </Suspense>
  );
}
