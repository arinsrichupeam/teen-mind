"use client";

import type { ComponentType, SVGProps } from "react";
import type { PsychologistProductivityStats } from "@/lib/dashboard/psychologist-productivity";

import { Card, CardBody } from "@heroui/react";
import {
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

type Props = {
  summary: PsychologistProductivityStats["summary"];
};

const formatNumber = (value: number) => value.toLocaleString("th-TH");

const CARD_CLASS = "bg-white border border-default-200";

type CardConfig = {
  label: string;
  value: string;
  hint?: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  accentClass: string;
};

export function ProductivitySummaryCards({ summary }: Props) {
  const cards: CardConfig[] = [
    {
      label: "นักจิตวิทยาที่มีเคส",
      value: formatNumber(summary.activePsychologists),
      hint: "คนที่ได้รับมอบหมายอย่างน้อย 1 ครั้ง",
      Icon: UserGroupIcon,
      accentClass: "text-primary-500",
    },
    {
      label: "เคสที่ดูแล",
      value: formatNumber(summary.totalActiveCases),
      hint: "จำนวนแบบประเมินที่ไม่ซ้ำกัน",
      Icon: ClipboardDocumentListIcon,
      accentClass: "text-sky-600",
    },
    {
      label: "ครั้งให้คำปรึกษาเสร็จสิ้น",
      value: formatNumber(summary.totalCompletedSessions),
      hint: `${summary.overallCompletionRate.toLocaleString("th-TH")}% ของทั้งหมด ${formatNumber(summary.totalAssignedSessions)} ครั้ง`,
      Icon: CheckCircleIcon,
      accentClass: "text-success-600",
    },
    {
      label: "รอดำเนินการ",
      value: formatNumber(summary.soapPending + summary.telemedPending),
      hint: `รอสรุป SOAP ${formatNumber(summary.soapPending)} · รอนัด/ผู้ให้คำปรึกษา ${formatNumber(summary.telemedPending)}`,
      Icon: ClockIcon,
      accentClass: "text-warning-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
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
