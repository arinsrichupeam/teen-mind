"use client";

import { Card, CardBody, CardHeader } from "@heroui/react";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";

type Props = {
  monthLabel: string;
  daysLabels: string[];
  shiftLabels: string[];
  cells: number[][]; // [dayIndex][shiftIndex]
  max: number;
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

export function AssessmentShiftMonthlyTable({
  monthLabel,
  daysLabels,
  shiftLabels,
  cells,
  max,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold">Heatmap รายเดือน (ช่วงเวร)</h3>
          <p className="text-sm text-default-500">เดือน: {monthLabel}</p>
        </div>
      </CardHeader>
      <CardBody className="overflow-x-auto">
        <Table isStriped aria-label="Assessment Shift Monthly Table">
          <TableHeader>
            <TableColumn className="text-center">วันที่</TableColumn>
            <TableColumn className="text-center">
              {shiftLabels[0] ?? "ดึก"}
            </TableColumn>
            <TableColumn className="text-center">
              {shiftLabels[1] ?? "เช้า"}
            </TableColumn>
            <TableColumn className="text-center">
              {shiftLabels[2] ?? "บ่าย"}
            </TableColumn>
          </TableHeader>
          <TableBody>
            {daysLabels.map((dayLabel, dayIndex) => {
              const counts = cells?.[dayIndex] ?? [];
              const c0 = counts[0] ?? 0; // ดึก
              const c1 = counts[1] ?? 0; // เช้า
              const c2 = counts[2] ?? 0; // บ่าย

              return (
                <TableRow key={`${dayLabel}-${dayIndex}`}>
                  <TableCell className="text-center whitespace-nowrap">
                    {dayLabel}
                  </TableCell>
                  <TableCell
                    className="text-center whitespace-nowrap font-semibold"
                    style={{ backgroundColor: getColor(c0, max) }}
                  >
                    {c0}
                  </TableCell>
                  <TableCell
                    className="text-center whitespace-nowrap font-semibold"
                    style={{ backgroundColor: getColor(c1, max) }}
                  >
                    {c1}
                  </TableCell>
                  <TableCell
                    className="text-center whitespace-nowrap font-semibold"
                    style={{ backgroundColor: getColor(c2, max) }}
                  >
                    {c2}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <div className="mt-3 flex items-center gap-3">
          <div className="text-xs text-default-600">น้อย</div>
          <div className="flex gap-1">
            {LEVEL_COLORS.map((color) => (
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
