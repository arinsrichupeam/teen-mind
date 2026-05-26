"use client";

import type { AgeSegmentStats } from "@/lib/dashboard/age-segment";

import { AgeSegmentCards } from "./age-segment-cards";
import { AgeSegmentRiskChart } from "./age-segment-risk-chart";

type Props = {
  data: AgeSegmentStats;
};

const formatNumber = (value: number) => value.toLocaleString("th-TH");

export function AgeSegmentSection({ data }: Props) {
  const otherAgeCount = data.ageUnder12 + data.ageUnspecified;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <AgeSegmentCards
          age12to18={data.age12to18}
          ageOver18={data.ageOver18}
          totalRecipients={data.totalRecipients}
        />
        {otherAgeCount > 0 ? (
          <p className="rounded-lg border border-default-200 bg-default-50 px-3 py-2 text-xs text-default-600">
            {`หมายเหตุ: อายุต่ำกว่า 12 ปี ${formatNumber(data.ageUnder12)} ราย · ไม่ระบุอายุ ${formatNumber(data.ageUnspecified)} ราย (รวม ${formatNumber(otherAgeCount)} รายที่นับใน "ผู้รับบริการทั้งหมด" แต่ไม่รวมในการ์ดช่วงอายุ 12–18 ปี และมากกว่า 18 ปี)`}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AgeSegmentRiskChart
          assessmentScale="phqa"
          risk={data.riskAge12to18}
          subtitle="เกณฑ์ผลการประเมินตามความเสี่ยง — PHQ-A"
          title="ผลการประเมินตามความเสี่ยง — อายุ 12–18 ปี"
        />
        <AgeSegmentRiskChart
          assessmentScale="9q"
          risk={data.riskAgeOver18}
          subtitle="เกณฑ์ผลการประเมินตามความเสี่ยง — 9Q"
          title="ผลการประเมินตามความเสี่ยง — อายุมากกว่า 18 ปี"
        />
      </div>
    </div>
  );
}
