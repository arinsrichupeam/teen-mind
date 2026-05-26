"use client";

import type { ComponentType, SVGProps } from "react";

import { Card, CardBody } from "@heroui/react";
import {
  UserGroupIcon,
  AcademicCapIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

type Props = {
  totalRecipients: number;
  age12to18: number;
  ageOver18: number;
};

const formatNumber = (value: number) => value.toLocaleString("th-TH");

type CardConfig = {
  label: string;
  value: number;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  accentClass: string;
};

const CARD_CLASS = "bg-white border border-default-200";

export function AgeSegmentCards({
  totalRecipients,
  age12to18,
  ageOver18,
}: Props) {
  const cards: CardConfig[] = [
    {
      label: "ผู้รับบริการทั้งหมด",
      value: totalRecipients,
      Icon: UserGroupIcon,
      accentClass: "text-primary-500",
    },
    {
      label: "อายุ 12–18 ปี",
      value: age12to18,
      Icon: AcademicCapIcon,
      accentClass: "text-sky-600",
    },
    {
      label: "อายุมากกว่า 18 ปี",
      value: ageOver18,
      Icon: UserIcon,
      accentClass: "text-violet-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map(({ label, value, Icon, accentClass }) => (
        <Card
          key={label}
          className={`rounded-xl shadow-md px-3 w-full ${CARD_CLASS}`}
        >
          <CardBody className="py-4 overflow-hidden">
            <div className="flex items-center gap-2 justify-start">
              <div className="flex flex-col basis-2/3">
                <span className="text-xs font-semibold whitespace-nowrap">
                  {label}
                </span>
                <span className={`text-2xl font-semibold ${accentClass}`}>
                  {formatNumber(value)}
                </span>
              </div>
              <div className="flex basis-1/3 gap-2 py-1 items-center justify-end">
                <Icon className={`size-7 ${accentClass}`} />
              </div>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
