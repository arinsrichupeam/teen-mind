"use client";

import clsx from "clsx";
import { Skeleton } from "@heroui/react";

function SectionTitleSkeleton({ className }: { className?: string }) {
  return (
    <Skeleton className={clsx("h-7 w-64 max-w-full rounded-md", className)} />
  );
}

export function DashboardChartAreaSkeleton({
  className,
  chartClassName,
}: {
  className?: string;
  chartClassName?: string;
}) {
  return (
    <div
      className={clsx(
        "rounded-lg border border-gray-200 shadow-md bg-white p-4",
        className
      )}
    >
      <Skeleton
        className={clsx("min-h-[240px] w-full rounded-lg", chartClassName)}
      />
    </div>
  );
}

export function DashboardDateRangeSlotSkeleton() {
  return (
    <div className="bg-white p-2 rounded-lg shadow-md border border-gray-200">
      <Skeleton className="h-10 w-full max-w-md rounded-lg" />
    </div>
  );
}

export function DashboardLast7DaysSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 shadow-md bg-white overflow-hidden">
      <div className="flex gap-2 p-3 border-b border-gray-100">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-5 flex-1 rounded-md min-w-0" />
        ))}
      </div>
      {Array.from({ length: 5 }).map((_, row) => (
        <div
          key={row}
          className="flex gap-2 p-2 border-b border-gray-50 last:border-0"
        >
          {Array.from({ length: 6 }).map((_, col) => (
            <Skeleton key={col} className="h-6 flex-1 rounded-md min-w-0" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function DashboardHeatmapSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 shadow-md bg-white p-4">
      <Skeleton className="min-h-[280px] w-full rounded-lg" />
    </div>
  );
}

export function DashboardUsageStatsSkeleton() {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-gray-200 shadow-md bg-white p-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex gap-3 items-center">
          <Skeleton className="h-6 w-24 rounded-md shrink-0" />
          <Skeleton className="h-6 flex-1 rounded-md min-w-0" />
        </div>
      ))}
    </div>
  );
}

export function AdminDashboardPageSkeleton() {
  return (
    <div className="h-full lg:px-6">
      <div className="flex flex-col gap-6 pt-3 px-4 lg:px-0 sm:pt-10 max-w-[90rem] mx-auto w-full">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2">
            <SectionTitleSkeleton />
            <DashboardChartAreaSkeleton chartClassName="min-h-[260px]" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2">
            <SectionTitleSkeleton />
            <DashboardChartAreaSkeleton chartClassName="min-h-[280px]" />
          </div>
        </div>

        <div className="flex flex-col gap-2 mb-8">
          <div className="flex flex-col gap-2">
            <SectionTitleSkeleton />
            <DashboardLast7DaysSkeleton />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="flex flex-col gap-2">
            <SectionTitleSkeleton />
            <DashboardDateRangeSlotSkeleton />
            <DashboardChartAreaSkeleton />
          </div>

          <div className="flex flex-col gap-2">
            <SectionTitleSkeleton />
            <DashboardDateRangeSlotSkeleton />
            <DashboardLast7DaysSkeleton />
          </div>

          <div className="flex flex-col gap-2 lg:col-span-2">
            <SectionTitleSkeleton />
            <DashboardDateRangeSlotSkeleton />
            <DashboardHeatmapSkeleton />
          </div>
        </div>

        <div className="flex flex-col gap-2 mb-8">
          <div className="flex flex-col gap-2">
            <SectionTitleSkeleton />
            <DashboardUsageStatsSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}
