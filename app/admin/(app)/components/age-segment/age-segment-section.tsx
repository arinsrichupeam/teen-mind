"use client";

import type { AgeSegmentStats } from "@/lib/dashboard/age-segment";

import { AgeSegmentCards } from "./age-segment-cards";
import { AgeSegmentRiskChart } from "./age-segment-risk-chart";

type Props = {
  data: AgeSegmentStats;
};

const formatNumber = (value: number) => value.toLocaleString("th-TH");

export function AgeSegmentSection({ data }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <AgeSegmentCards
          age18AndOver={data.age18AndOver}
          ageUnder18={data.ageUnder18}
          totalRecipients={data.totalRecipients}
        />
        {data.ageUnspecified > 0 ? (
          <p className="rounded-lg border border-default-200 bg-default-50 px-3 py-2 text-xs text-default-600">
            {`หมายเหตุ: ไม่ระบุอายุ ${formatNumber(data.ageUnspecified)} ราย (นับใน "ผู้รับบริการทั้งหมด" แต่ไม่รวมในการ์ดช่วงอายุต่ำกว่า 18 ปี และ 18 ปีขึ้นไป)`}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AgeSegmentRiskChart
          assessmentScale="phqa"
          risk={data.riskAgeUnder18}
          subtitle="เกณฑ์ผลการประเมินตามความเสี่ยง — PHQ-A"
          title="ผลการประเมินตามความเสี่ยง — อายุต่ำกว่า 18 ปี"
        />
        <AgeSegmentRiskChart
          assessmentScale="9q"
          risk={data.riskAge18AndOver}
          subtitle="เกณฑ์ผลการประเมินตามความเสี่ยง — 9Q"
          title="ผลการประเมินตามความเสี่ยง — อายุ 18 ปีขึ้นไป"
        />
      </div>
    </div>
  );
}
