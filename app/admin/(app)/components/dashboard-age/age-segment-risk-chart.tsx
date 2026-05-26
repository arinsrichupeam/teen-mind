"use client";

import type { RiskByAgeGroup } from "@/lib/dashboard/age-segment";

import { useMemo } from "react";
import { Card, CardBody, CardHeader } from "@heroui/react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type AssessmentScale = "phqa" | "9q";

type Props = {
  title: string;
  subtitle: string;
  risk: RiskByAgeGroup;
  assessmentScale: AssessmentScale;
};

const COLORS = {
  green: "#22c55e",
  greenLow: "#4ade80",
  yellow: "#eab308",
  orange: "#f97316",
  red: "#ef4444",
};

const RISK_TEXT_CLASS: Record<string, string> = {
  green: "text-green-700",
  greenLow: "text-emerald-600",
  yellow: "text-yellow-700",
  orange: "text-orange-700",
  red: "text-red-700",
};

export type RiskRow = {
  key: string;
  name: string;
  value: number;
  color: string;
};

const formatNumber = (value: number) => value.toLocaleString("th-TH");

function pct(value: number, total: number) {
  if (total <= 0) return "0%";

  return `${((value / total) * 100).toFixed(1)}%`;
}

export function buildPhqaRiskRows(risk: RiskByAgeGroup): RiskRow[] {
  return [
    {
      key: "green",
      name: "ไม่พบความเสี่ยง",
      value: risk.green,
      color: COLORS.green,
    },
    {
      key: "greenLow",
      name: "พบความเสี่ยงเล็กน้อย",
      value: risk.greenLow,
      color: COLORS.greenLow,
    },
    {
      key: "yellow",
      name: "พบความเสี่ยงปานกลาง",
      value: risk.yellow,
      color: COLORS.yellow,
    },
    {
      key: "orange",
      name: "พบความเสี่ยงมาก",
      value: risk.orange,
      color: COLORS.orange,
    },
    {
      key: "red",
      name: "พบความเสี่ยงรุนแรง",
      value: risk.red,
      color: COLORS.red,
    },
  ];
}

export function buildNineQRiskRows(risk: RiskByAgeGroup): RiskRow[] {
  return [
    {
      key: "green",
      name: "ไม่มีอาการฯ ระดับน้อยมาก",
      value: risk.green + risk.greenLow,
      color: COLORS.green,
    },
    {
      key: "yellow",
      name: "มีอาการฯ ระดับน้อย",
      value: risk.yellow,
      color: COLORS.yellow,
    },
    {
      key: "orange",
      name: "มีอาการฯ ระดับปานกลาง",
      value: risk.orange,
      color: COLORS.orange,
    },
    {
      key: "red",
      name: "มีอาการฯ ระดับรุนแรง",
      value: risk.red,
      color: COLORS.red,
    },
  ];
}

function RiskSummaryTable({ rows, total }: { rows: RiskRow[]; total: number }) {
  return (
    <div className="mt-4 rounded-lg border border-default-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-default-100 text-default-600">
            <th className="text-left font-medium px-3 py-2">ระดับความเสี่ยง</th>
            <th className="text-right font-medium px-3 py-2 w-24">
              จำนวน (คน)
            </th>
            <th className="text-right font-medium px-3 py-2 w-20">สัดส่วน</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.key}
              className="border-t border-default-100 even:bg-default-50/50"
            >
              <td className="px-3 py-2">
                <span className="inline-flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: row.color }}
                  />
                  <span className="text-default-700">{row.name}</span>
                </span>
              </td>
              <td
                className={`text-right px-3 py-2 font-semibold tabular-nums ${RISK_TEXT_CLASS[row.key] ?? ""}`}
              >
                {formatNumber(row.value)}
              </td>
              <td
                className={`text-right px-3 py-2 tabular-nums ${RISK_TEXT_CLASS[row.key] ?? "text-default-500"}`}
              >
                {pct(row.value, total)}
              </td>
            </tr>
          ))}
          <tr className="border-t border-default-200 bg-default-100/80 font-semibold">
            <td className="px-3 py-2">รวม</td>
            <td className="text-right px-3 py-2 tabular-nums">
              {formatNumber(total)}
            </td>
            <td className="text-right px-3 py-2">100%</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

type BarLabelProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  value?: number;
  index?: number;
  payload?: RiskRow;
  total: number;
};

function BarCountLabel({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  value = 0,
  total,
  payload,
}: BarLabelProps) {
  if (!value || value <= 0) return null;

  const label = `${formatNumber(value)} คน (${pct(value, total)})`;

  return (
    <text
      dominantBaseline="middle"
      fill={payload?.color ?? "#374151"}
      fontSize={11}
      fontWeight={600}
      textAnchor="start"
      x={x + width + 6}
      y={y + height / 2}
    >
      {label}
    </text>
  );
}

export function AgeSegmentRiskChart({
  title,
  subtitle,
  risk,
  assessmentScale,
}: Props) {
  const rows = useMemo(
    () =>
      assessmentScale === "phqa"
        ? buildPhqaRiskRows(risk)
        : buildNineQRiskRows(risk),
    [risk, assessmentScale]
  );

  const chartRows = useMemo(() => rows.filter((row) => row.value > 0), [rows]);

  const totalRiskUsers = risk.totalUsers;
  const chartHeight = Math.max(200, chartRows.length * 52 + 24);

  return (
    <Card className="w-full bg-white border border-default-200 shadow-md">
      <CardHeader className="flex flex-col items-start gap-1 pb-0">
        <h4 className="text-base font-semibold">{title}</h4>
        <p className="text-xs text-default-500 font-normal">{subtitle}</p>
      </CardHeader>
      <CardBody>
        <div className="text-sm text-default-600 mb-3">
          จำนวนผู้ประเมิน:{" "}
          <span className="font-semibold text-foreground">
            {formatNumber(totalRiskUsers)} คน
          </span>
        </div>

        {totalRiskUsers === 0 ? (
          <div className="flex items-center justify-center h-[200px] text-default-500">
            ไม่พบข้อมูล
          </div>
        ) : (
          <>
            <ResponsiveContainer height={chartHeight} width="100%">
              <BarChart
                data={chartRows}
                layout="vertical"
                margin={{ top: 4, right: 120, left: 4, bottom: 4 }}
              >
                <XAxis hide type="number" />
                <YAxis
                  axisLine={false}
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#4b5563" }}
                  tickLine={false}
                  type="category"
                  width={assessmentScale === "9q" ? 148 : 128}
                />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.04)" }}
                  formatter={(value: number) => [
                    `${formatNumber(value)} คน (${pct(value, totalRiskUsers)})`,
                    "จำนวน",
                  ]}
                  labelFormatter={(label) => label}
                />
                <Bar
                  barSize={28}
                  dataKey="value"
                  label={(props) => (
                    <BarCountLabel {...props} total={totalRiskUsers} />
                  )}
                  radius={[0, 6, 6, 0]}
                >
                  {chartRows.map((entry) => (
                    <Cell key={entry.key} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <RiskSummaryTable rows={rows} total={totalRiskUsers} />
          </>
        )}
      </CardBody>
    </Card>
  );
}
