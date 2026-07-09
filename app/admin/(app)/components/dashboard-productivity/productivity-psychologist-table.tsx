"use client";

import type { PsychologistProductivityRow } from "@/lib/dashboard/psychologist-productivity";

import {
  Chip,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";

import { PRODUCTIVITY_STATUS } from "./productivity-status-labels";

type Props = {
  rows: PsychologistProductivityRow[];
  periodLabel?: string | null;
};

const formatNumber = (value: number) => value.toLocaleString("th-TH");

const {
  awaitingConsult,
  awaitingSummary,
  completed,
  unreachable,
  completionRate,
} = PRODUCTIVITY_STATUS;

const columns = [
  { key: "rank", label: "#", align: "center" as const },
  { key: "name", label: "นักจิตวิทยา" },
  { key: "activeCases", label: "เคส", align: "center" as const },
  { key: "status1", label: awaitingConsult, align: "center" as const },
  { key: "status2", label: awaitingSummary, align: "center" as const },
  { key: "status3", label: completed, align: "center" as const },
  { key: "unreachable", label: unreachable, align: "center" as const },
  { key: "completionRate", label: completionRate, align: "center" as const },
];

const completionChipColor = (rate: number) => {
  if (rate >= 80) return "success";
  if (rate >= 50) return "warning";

  return "danger";
};

const sumField = (
  items: PsychologistProductivityRow[],
  key: keyof Pick<
    PsychologistProductivityRow,
    "unreachable" | "status1" | "status2" | "status3"
  >
) => items.reduce((sum, row) => sum + row[key], 0);

export function ProductivityPsychologistTable({ rows, periodLabel }: Props) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-default-200 bg-default-50 px-4 py-10 text-center text-default-500">
        ไม่มีข้อมูลการให้คำปรึกษาในช่วงเวลาที่เลือก
      </div>
    );
  }

  const totals = {
    cases: rows.reduce((sum, row) => sum + row.activeCases, 0),
    status1: sumField(rows, "status1"),
    status2: sumField(rows, "status2"),
    status3: sumField(rows, "status3"),
    unreachable: sumField(rows, "unreachable"),
  };

  const heading = periodLabel ?? "ข้อมูลทั้งหมด";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-default-500">
          ใช้ตัวกรองช่วงเวลามุมล่างขวาเพื่อเลือกเดือนหรือช่วงที่ต้องการ
        </p>

        <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
          <Chip size="sm" variant="flat">
            เคส {formatNumber(totals.cases)}
          </Chip>
          <Chip color="warning" size="sm" variant="flat">
            {awaitingConsult} {formatNumber(totals.status1)}
          </Chip>
          <Chip color="primary" size="sm" variant="flat">
            {awaitingSummary} {formatNumber(totals.status2)}
          </Chip>
          <Chip color="success" size="sm" variant="flat">
            {completed} {formatNumber(totals.status3)}
          </Chip>
          <Chip color="danger" size="sm" variant="flat">
            {unreachable} {formatNumber(totals.unreachable)}
          </Chip>
        </div>
      </div>

      <div className="rounded-xl border border-default-200 bg-white overflow-hidden">
        <div className="border-b border-default-200 bg-default-50 px-4 py-2.5">
          <p className="text-sm font-semibold text-default-700">{heading}</p>
          <p className="text-xs text-default-500">
            นักจิตวิทยา {formatNumber(rows.length)} คน
          </p>
        </div>

        <Table
          aria-label="ตาราง Productivity นักจิตวิทยา"
          classNames={{
            th: "bg-default-50 text-default-700 text-xs",
            td: "text-sm",
          }}
        >
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn key={column.key} align={column.align}>
                {column.label}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody emptyContent="ไม่มีข้อมูล">
            {rows.map((row, index) => (
              <TableRow key={row.userId}>
                <TableCell className="text-center">{index + 1}</TableCell>
                <TableCell>
                  <span className="font-medium text-default-800">
                    {row.name}
                  </span>
                </TableCell>
                <TableCell className="tabular-nums text-center">
                  {formatNumber(row.activeCases)}
                </TableCell>
                <TableCell className="tabular-nums text-center text-warning-600">
                  {formatNumber(row.status1)}
                </TableCell>
                <TableCell className="tabular-nums text-center text-primary-600">
                  {formatNumber(row.status2)}
                </TableCell>
                <TableCell className="tabular-nums text-center text-success-600">
                  {formatNumber(row.status3)}
                </TableCell>
                <TableCell className="tabular-nums text-center text-danger-500">
                  {formatNumber(row.unreachable)}
                </TableCell>
                <TableCell className="text-center">
                  <Chip
                    className="mx-auto"
                    color={completionChipColor(row.completionRate)}
                    size="sm"
                    variant="flat"
                  >
                    {row.completionRate.toLocaleString("th-TH")}%
                  </Chip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
