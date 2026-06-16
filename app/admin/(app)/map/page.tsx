"use client";

import { Suspense } from "react";

import { AssessmentMap } from "../components/map/assessment-map";

import Loading from "@/app/loading";

export default function MapPage() {
  return (
    <Suspense fallback={<Loading />}>
      <div className="mx-auto w-full max-w-[1600px] flex-1 p-4 md:p-6">
        <div className="mb-4">
          <h1 className="text-2xl font-bold">แผนที่</h1>
          <p className="mt-1 text-sm text-default-600">
            แสดงตำแหน่งที่ทำแบบประเมินตามพิกัด latitude / longitude
          </p>
        </div>
        <AssessmentMap />
      </div>
    </Suspense>
  );
}
