"use client";

import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/react";

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

  const riskLabels = {
    green: "ไม่พบความเสี่ยง",
    greenLow: "ความเสี่ยงเล็กน้อย",
    yellow: "ความเสี่ยงปานกลาง",
    orange: "ความเสี่ยงมาก",
    red: "ความเสี่ยงรุนแรง",
  } satisfies Record<
    "green" | "greenLow" | "yellow" | "orange" | "red",
    string
  >;

  const riskCellClassNames = {
    green: "text-green-700",
    greenLow: "text-emerald-700",
    yellow: "text-yellow-700",
    orange: "text-orange-700",
    red: "text-red-700",
  } satisfies Record<
    "green" | "greenLow" | "yellow" | "orange" | "red",
    string
  >;

  return (
    <div className="overflow-x-auto">
      <Table isStriped aria-label="Last 7 days usage by risk level">
        <TableHeader>
          <TableColumn className="min-w-[90px]">วัน</TableColumn>
          <TableColumn className="text-center">
            <span className="text-green-700 font-semibold">
              {riskLabels.green}
            </span>
          </TableColumn>
          <TableColumn className="text-center">
            <span className="text-emerald-700 font-semibold">
              {riskLabels.greenLow}
            </span>
          </TableColumn>
          <TableColumn className="text-center">
            <span className="text-yellow-700 font-semibold">
              {riskLabels.yellow}
            </span>
          </TableColumn>
          <TableColumn className="text-center">
            <span className="text-orange-700 font-semibold">
              {riskLabels.orange}
            </span>
          </TableColumn>
          <TableColumn className="text-center">
            <span className="text-red-700 font-semibold">{riskLabels.red}</span>
          </TableColumn>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.dayLabel}>
              <TableCell className="font-semibold">{row.dayLabel}</TableCell>
              <TableCell
                className={`text-center font-semibold ${riskCellClassNames.green}`}
              >
                {formatNumber(row.green)}
              </TableCell>
              <TableCell
                className={`text-center font-semibold ${riskCellClassNames.greenLow}`}
              >
                {formatNumber(row.greenLow)}
              </TableCell>
              <TableCell
                className={`text-center font-semibold ${riskCellClassNames.yellow}`}
              >
                {formatNumber(row.yellow)}
              </TableCell>
              <TableCell
                className={`text-center font-semibold ${riskCellClassNames.orange}`}
              >
                {formatNumber(row.orange)}
              </TableCell>
              <TableCell
                className={`text-center font-semibold ${riskCellClassNames.red}`}
              >
                {formatNumber(row.red)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
