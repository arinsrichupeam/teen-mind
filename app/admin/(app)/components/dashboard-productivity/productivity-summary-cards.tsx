"use client";

import type { ComponentType, SVGProps } from "react";
import type { PsychologistProductivityStats } from "@/lib/dashboard/psychologist-productivity";

import { Card, CardBody } from "@heroui/react";
import {
  ClipboardDocumentListIcon,
  ClockIcon,
  ShieldExclamationIcon,
} from "@heroicons/react/24/outline";

import { PRODUCTIVITY_STATUS } from "./productivity-status-labels";

type Props = {
  summary: PsychologistProductivityStats["summary"];
};

const formatNumber = (value: number) => value.toLocaleString("th-TH");

/** แสดงเวลาเข้าถึงเฉลี่ย เป็นหลักชั่วโมง นาที เช่น 8 ชม. 30 นาที */
const formatAvgAccessDuration = (hours: number) => {
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  if (h === 0) {
    return `${m.toLocaleString("th-TH")} นาที`;
  }

  if (m === 0) {
    return `${h.toLocaleString("th-TH")} ชม.`;
  }

  return `${h.toLocaleString("th-TH")} ชม. ${m.toLocaleString("th-TH")} นาที`;
};

const CARD_CLASS = "bg-white border border-default-200";

type CardConfig = {
  label: string;
  value: string;
  hint?: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  accentClass: string;
};

export function ProductivitySummaryCards({ summary }: Props) {
  const { redCase24hAccess, statusBreakdown } = summary;
  const { awaitingConsult, awaitingSummary, completed, completionRate } =
    PRODUCTIVITY_STATUS;

  const cards: CardConfig[] = [
    {
      label: "เคสที่ดูแล",
      value: formatNumber(summary.totalActiveCases),
      hint: `${awaitingConsult} ${formatNumber(statusBreakdown.status1)} · ${awaitingSummary} ${formatNumber(statusBreakdown.status2)} · ${completed} ${formatNumber(statusBreakdown.status3)} · ${completionRate} ${summary.overallCompletionRate.toLocaleString("th-TH")}%`,
      Icon: ClipboardDocumentListIcon,
      accentClass: "text-sky-600",
    },
    {
      label: "เข้าถึง Case Red ≤24 ชม.",
      value: `${redCase24hAccess.rate.toLocaleString("th-TH")}%`,
      hint:
        redCase24hAccess.total > 0
          ? `${formatNumber(redCase24hAccess.within24h)} จาก ${formatNumber(redCase24hAccess.total)} เคสแดง`
          : "ไม่มีเคสแดงในช่วงที่เลือก",
      Icon: ShieldExclamationIcon,
      accentClass: "text-danger-600",
    },
    {
      label: "เวลาเข้าถึง Case Red เฉลี่ย",
      value:
        redCase24hAccess.avgAccessHours !== null
          ? formatAvgAccessDuration(redCase24hAccess.avgAccessHours)
          : "—",
      hint:
        redCase24hAccess.avgAccessHours !== null
          ? `จากคัดกรอง → พบนักจิตรอบ 1 · ${formatNumber(redCase24hAccess.reached)} เคสที่พบแล้ว`
          : redCase24hAccess.total > 0
            ? "ยังไม่มีเคสแดงที่พบนักจิตครั้งที่ 1"
            : "ไม่มีเคสแดงในช่วงที่เลือก",
      Icon: ClockIcon,
      accentClass: "text-orange-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {cards.map(({ label, value, hint, Icon, accentClass }) => (
        <Card
          key={label}
          className={`rounded-xl shadow-md px-3 w-full ${CARD_CLASS}`}
        >
          <CardBody className="py-4 overflow-hidden">
            <div className="flex items-start gap-3">
              <div className="flex flex-col flex-1 min-w-0 gap-1">
                <span className="text-xs font-semibold text-default-700">
                  {label}
                </span>
                <span
                  className={`text-2xl font-semibold tabular-nums ${accentClass}`}
                >
                  {value}
                </span>
                {hint ? (
                  <span className="text-xs text-default-500 leading-snug">
                    {hint}
                  </span>
                ) : null}
              </div>
              <Icon className={`size-7 shrink-0 ${accentClass}`} />
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
