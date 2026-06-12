"use client";

import { Skeleton } from "@heroui/react";

export function DashboardProductivitySkeleton() {
  return (
    <div className="h-full lg:px-6">
      <div className="flex flex-col gap-8 pt-3 pb-8 px-4 lg:px-0 sm:pt-10 sm:pb-10 max-w-[90rem] mx-auto w-full">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-96 max-w-full rounded-md" />
          <Skeleton className="h-4 w-full max-w-2xl rounded-md" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Skeleton className="h-[380px] w-full rounded-xl" />
          <Skeleton className="h-[380px] w-full rounded-xl" />
        </div>

        <Skeleton className="h-[420px] w-full rounded-xl" />
      </div>
    </div>
  );
}
