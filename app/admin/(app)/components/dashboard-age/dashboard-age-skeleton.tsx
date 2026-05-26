"use client";

import { Skeleton } from "@heroui/react";

export function DashboardAgePageSkeleton() {
  return (
    <div className="h-full lg:px-6">
      <div className="flex flex-col gap-10 pt-3 pb-8 px-4 lg:px-0 sm:pt-10 sm:pb-10 max-w-[90rem] mx-auto w-full">
        {Array.from({ length: 2 }).map((_, section) => (
          <div key={section} className="flex flex-col gap-6">
            <Skeleton className="h-7 w-72 max-w-full rounded-md" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Skeleton className="h-[360px] w-full rounded-lg" />
              <Skeleton className="h-[360px] w-full rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
