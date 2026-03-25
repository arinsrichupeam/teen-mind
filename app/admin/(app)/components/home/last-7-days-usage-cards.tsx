"use client";

import { Card, CardBody } from "@heroui/react";

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

type Props = {
  data: Last7DayStat[];
};

const formatNumber = (value: number) => value.toLocaleString("th-TH");

export function Last7DaysUsageCards({ data }: Props) {
  if (!data || data.length === 0) return null;

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {data.map((row) => (
        <Card key={row.dayLabel} className="min-w-[220px]">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-default-800">
                {row.dayLabel}
              </p>
            </div>

            <div className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-default-600">เข้าใช้</span>
                <span className="font-semibold">
                  {formatNumber(row.totalUse)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-default-600">ผู้ใช้งาน</span>
                <span className="font-semibold">
                  {formatNumber(row.totalUsers)}
                </span>
              </div>
            </div>

            <div className="mt-3 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-green-700">ไม่พบความเสี่ยง</span>
                <span className="font-semibold text-green-700">
                  {formatNumber(row.green)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-700">ความเสี่ยงเล็กน้อย</span>
                <span className="font-semibold text-emerald-700">
                  {formatNumber(row.greenLow)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-700">ความเสี่ยงปานกลาง</span>
                <span className="font-semibold text-yellow-700">
                  {formatNumber(row.yellow)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-orange-700">ความเสี่ยงมาก</span>
                <span className="font-semibold text-orange-700">
                  {formatNumber(row.orange)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-700">ความเสี่ยงรุนแรง</span>
                <span className="font-semibold text-red-700">
                  {formatNumber(row.red)}
                </span>
              </div>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
