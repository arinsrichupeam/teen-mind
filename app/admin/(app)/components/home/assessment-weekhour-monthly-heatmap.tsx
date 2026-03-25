"use client";

import { Card, CardBody, CardHeader } from "@heroui/react";

type Props = {
  monthLabel: string;
  weekdayLabels: string[]; // 7 items
  hourLabels: number[]; // 24 items (เรียงแบบ 08-23,00-07)
  cells: number[][]; // [weekday][hour 0..23]
  max: number;
  total: number;
};

const LEVEL_COLORS = ["#f8fafc", "#dbeafe", "#93c5fd", "#60a5fa", "#2563eb"];

const getColor = (count: number, max: number) => {
  if (count <= 0 || max <= 0) return LEVEL_COLORS[0];
  const level = Math.min(
    LEVEL_COLORS.length - 1,
    Math.floor((count / max) * (LEVEL_COLORS.length - 1))
  );

  return LEVEL_COLORS[level];
};

const pad2 = (n: number) => String(n).padStart(2, "0");

export function AssessmentWeekhourMonthlyHeatmap({
  monthLabel,
  weekdayLabels,
  hourLabels,
  cells,
  max,
  total,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex w-full items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-semibold">แผนที่ความร้อนตามเวลา</h3>
            <p className="text-sm text-default-500">เดือน: {monthLabel}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-default-600">
            <span>น้อย</span>
            <div className="flex gap-1">
              {LEVEL_COLORS.map((c) => (
                <div
                  key={c}
                  className="h-2 w-5 rounded-sm"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <span>มาก</span>
            <span className="ml-2">
              สูงสุด: {total.toLocaleString("th-TH")}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardBody>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="sticky left-0 bg-white z-10 text-left p-2 border border-gray-200 w-[90px]">
                  วัน
                </th>
                {hourLabels.map((h) => {
                  const isShiftBorder = h === 16 || h === 0;

                  return (
                    <th
                      key={h}
                      className="text-center p-2 border border-gray-200 min-w-[36px]"
                      style={{
                        borderLeftWidth: isShiftBorder ? 3 : undefined,
                        borderLeftColor: isShiftBorder ? "#4b5563" : undefined,
                      }}
                    >
                      {pad2(h)}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {weekdayLabels.map((dayLabel, weekday) => (
                <tr key={dayLabel}>
                  <td className="sticky left-0 bg-white z-10 text-left p-2 border border-gray-200 whitespace-nowrap">
                    {dayLabel}
                  </td>
                  {hourLabels.map((h) => {
                    const count = cells?.[weekday]?.[h] ?? 0;
                    const isShiftBorder = h === 16 || h === 0;

                    return (
                      <td
                        key={`${weekday}-${h}`}
                        className="p-0 border border-gray-200"
                        style={{
                          borderLeftWidth: isShiftBorder ? 3 : undefined,
                          borderLeftColor: isShiftBorder
                            ? "#4b5563"
                            : undefined,
                        }}
                        title={`${dayLabel} ${pad2(h)}:00 - ${count} ครั้ง`}
                      >
                        <div
                          className="h-7 w-full flex items-center justify-center"
                          style={{ backgroundColor: getColor(count, max) }}
                        >
                          {count > 0 ? count : ""}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-2 text-center text-xs text-default-500">
          แสดงปริมาณจำนวนตามวันในสัปดาห์และช่วงเวลาในวัน
        </div>
      </CardBody>
    </Card>
  );
}
