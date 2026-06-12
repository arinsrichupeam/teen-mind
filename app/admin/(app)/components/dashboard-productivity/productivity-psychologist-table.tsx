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

type Props = {
  rows: PsychologistProductivityRow[];
  periodLabel?: string | null;
};

const formatNumber = (value: number) => value.toLocaleString("th-TH");

const columns = [
  { key: "rank", label: "#", align: "center" as const },
  { key: "name", label: "นักจิตวิทยา" },
  { key: "activeCases", label: "เคส", align: "center" as const },
  { key: "assignedSessions", label: "มอบหมาย", align: "center" as const },
  { key: "completedSessions", label: "เสร็จสิ้น", align: "center" as const },
  { key: "soapPending", label: "รอสรุป", align: "center" as const },
  { key: "telemedPending", label: "รอนัด", align: "center" as const },
  { key: "completionRate", label: "อัตรา", align: "center" as const },
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
    "assignedSessions" | "completedSessions" | "soapPending" | "telemedPending"
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
    assigned: sumField(rows, "assignedSessions"),
    completed: sumField(rows, "completedSessions"),
    soapPending: sumField(rows, "soapPending"),
    telemedPending: sumField(rows, "telemedPending"),
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
            มอบหมาย {formatNumber(totals.assigned)}
          </Chip>
          <Chip color="success" size="sm" variant="flat">
            เสร็จ {formatNumber(totals.completed)}
          </Chip>
          <Chip color="warning" size="sm" variant="flat">
            รอสรุป {formatNumber(totals.soapPending)}
          </Chip>
          <Chip color="primary" size="sm" variant="flat">
            รอนัด {formatNumber(totals.telemedPending)}
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
                <TableCell className="tabular-nums text-center">
                  {formatNumber(row.assignedSessions)}
                </TableCell>
                <TableCell className="tabular-nums text-center text-success-600 font-medium">
                  {formatNumber(row.completedSessions)}
                </TableCell>
                <TableCell className="tabular-nums text-center text-warning-600">
                  {formatNumber(row.soapPending)}
                </TableCell>
                <TableCell className="tabular-nums text-center text-primary-600">
                  {formatNumber(row.telemedPending)}
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
