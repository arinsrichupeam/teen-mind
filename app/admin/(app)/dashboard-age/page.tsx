"use client";

import type { AgeSegmentStats } from "@/lib/dashboard/age-segment";

import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { Divider } from "@heroui/react";

import { AgeSegmentSection } from "../components/dashboard-age/age-segment-section";
import { DashboardAgePageSkeleton } from "../components/dashboard-age/dashboard-age-skeleton";

import Loading from "@/app/loading";

/** 1 เม.ย. 2569 (ค.ศ. 2026) */
const PERIOD_START = "2026-04-01";

const fetchAgeSegment = async (params?: {
  dateFrom?: string;
}): Promise<AgeSegmentStats> => {
  const search = new URLSearchParams();

  if (params?.dateFrom) search.set("dateFrom", params.dateFrom);

  const url = `/api/dashboard/age-segment${
    search.toString() ? `?${search.toString()}` : ""
  }`;

  const res = await fetch(url, { credentials: "include" });

  if (!res.ok) {
    throw new Error(
      res.status === 401 ? "Unauthorized" : "Failed to fetch age segment stats"
    );
  }

  return res.json();
};

export default function DashboardAgePage() {
  const { data: allTimeData, isLoading: isLoadingAll } = useQuery({
    queryKey: ["age-segment", "all"],
    queryFn: () => fetchAgeSegment(),
  });

  const { data: periodData, isLoading: isLoadingPeriod } = useQuery({
    queryKey: ["age-segment", "period", PERIOD_START],
    queryFn: () => fetchAgeSegment({ dateFrom: PERIOD_START }),
  });

  if (isLoadingAll || isLoadingPeriod) {
    return <DashboardAgePageSkeleton />;
  }

  if (!allTimeData || !periodData) {
    return <div className="p-8 text-center text-default-500">ไม่พบข้อมูล</div>;
  }

  return (
    <Suspense fallback={<Loading />}>
      <div className="h-full lg:px-6">
        <div className="flex flex-col gap-10 pt-3 pb-8 px-4 lg:px-0 sm:pt-10 sm:pb-10 max-w-[90rem] mx-auto w-full">
          <header className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold">
              Dashboard สถิติผู้รับบริการแยกตามอายุ
            </h1>
            <p className="text-sm text-default-600">
              กลุ่ม 12–18 ปีใช้เกณฑ์ PHQ-A กลุ่มมากกว่า 18 ปีใช้เกณฑ์ 9Q ·
              อายุนับจากวันที่ประเมิน (วันคัดกรองของโรงเรียน หากมี
              มิฉะนั้นใช้วันที่ทำแบบประเมินล่าสุด)
            </p>
          </header>

          <section className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold">
              ข้อมูลทั้งหมด
              {allTimeData.label ? (
                <span className="text-base font-normal text-default-600 ml-2">
                  ({allTimeData.label})
                </span>
              ) : null}
            </h2>
            <AgeSegmentSection data={allTimeData} />
          </section>

          <Divider className="my-2" />

          <section className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold">
              ข้อมูลช่วง 1 เม.ย. 2569 – ปัจจุบัน
              {periodData.label ? (
                <span className="text-base font-normal text-default-600 ml-2">
                  ({periodData.label})
                </span>
              ) : null}
            </h2>
            <AgeSegmentSection data={periodData} />
          </section>
        </div>
      </div>
    </Suspense>
  );
}
