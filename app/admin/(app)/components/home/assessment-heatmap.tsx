"use client";

import { Card, CardBody, CardHeader } from "@heroui/react";

type Props = {
  daysLabels: string[];
  hours: number[]; // 0..23
  cells: number[][]; // [dayIndex][hour]
  max: number;
};

const levelColors = ["#f8fafc", "#dbeafe", "#93c5fd", "#60a5fa", "#2563eb"];

const getColor = (count: number, max: number) => {
  if (count <= 0 || max <= 0) return levelColors[0];
  const level = Math.min(
    levelColors.length - 1,
    Math.floor((count / max) * (levelColors.length - 1))
  );

  return levelColors[level];
};

export function AssessmentHeatmap({ daysLabels, hours, cells, max }: Props) {
  const dayCount = daysLabels.length;

  // แสดง label เฉพาะบางช่วงเพื่อลดความรก
  const visibleHourLabels = new Set([0, 3, 6, 9, 12, 15, 18, 21]);

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Heatmap เวลาเมื่อทำแบบประเมิน</h3>
      </CardHeader>
      <CardBody>
        <div className="overflow-x-auto">
          <div
            className="grid gap-1"
            style={{
              gridTemplateColumns: `70px repeat(${dayCount}, 1fr)`,
            }}
          >
            {/* Header row */}
            <div />
            {daysLabels.map((label) => (
              <div
                key={label}
                className="text-center text-[11px] font-medium text-default-600"
              >
                {label}
              </div>
            ))}

            {/* Body */}
            {hours.map((hour) => {
              const showLabel = visibleHourLabels.has(hour);
              const label = showLabel
                ? `${String(hour).padStart(2, "0")}:00`
                : "";

              return (
                <div key={hour} className="contents">
                  <div className="text-right pr-2 text-[11px] text-default-600">
                    {label}
                  </div>
                  {Array.from({ length: dayCount }, (_, dayIndex) => {
                    const count = cells?.[dayIndex]?.[hour] ?? 0;
                    const bg = getColor(count, max);

                    return (
                      <div
                        key={`${dayIndex}-${hour}`}
                        className="h-5 w-5 rounded-sm border border-gray-100"
                        style={{ backgroundColor: bg }}
                        title={`${daysLabels[dayIndex]} ${String(hour).padStart(2, "0")}:00 - ${count} ครั้ง`}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <div className="text-xs text-default-600">น้อย</div>
          <div className="flex gap-1">
            {levelColors.map((color) => (
              <div
                key={color}
                className="h-2 w-4 rounded-sm"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <div className="text-xs text-default-600">มาก</div>
        </div>
      </CardBody>
    </Card>
  );
}
