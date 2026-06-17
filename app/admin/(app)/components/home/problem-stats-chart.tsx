"use client";

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

export type ProblemStat = {
  key: string;
  label: string;
  group: string;
  count: number;
};

const GROUP_COLORS: Record<string, string> = {
  ครอบครัว: "#22C55E",
  สังคม: "#3B82F6",
  การเรียน: "#8B5CF6",
  การเงิน: "#F97316",
  พฤติกรรม: "#EAB308",
};

const formatNumber = (value: number) => value.toLocaleString("th-TH");

function pct(value: number, total: number) {
  if (total <= 0) return "0%";

  return `${((value / total) * 100).toFixed(1)}%`;
}

type BarLabelProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  value?: number;
  index?: number;
  payload?: ProblemStat & { color: string };
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
      {`${formatNumber(value)} (${pct(value, total)})`}
    </text>
  );
}

interface ProblemStatsChartProps {
  problems: ProblemStat[];
  topN?: number;
}

export function ProblemStatsChart({
  problems,
  topN = 5,
}: ProblemStatsChartProps) {
  const chartData = useMemo(() => {
    return problems
      .filter((p) => p.count > 0)
      .slice(0, topN)
      .map((p) => ({ ...p, color: GROUP_COLORS[p.group] ?? "#6b7280" }));
  }, [problems, topN]);

  const total = useMemo(
    () => chartData.reduce((sum, p) => sum + p.count, 0),
    [chartData]
  );

  const chartHeight = Math.max(200, chartData.length * 44 + 24);

  const groups = useMemo(() => {
    const seen = new Set<string>();
    const out: { group: string; color: string }[] = [];

    for (const p of chartData) {
      if (!seen.has(p.group)) {
        seen.add(p.group);
        out.push({ group: p.group, color: GROUP_COLORS[p.group] ?? "#6b7280" });
      }
    }

    return out;
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <Card className="w-full border border-default-200 shadow-md">
        <CardBody>
          <div className="flex items-center justify-center h-[200px] text-default-500">
            ไม่พบข้อมูลปัญหา
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-white border border-default-200 shadow-md">
      <CardHeader className="flex flex-col items-start gap-1 pb-0">
        <h4 className="text-base font-semibold">ปัญหาที่พบบ่อย (Top {topN})</h4>
        <p className="text-xs text-default-500 font-normal">
          จากผู้ที่ระบุปัญหาในแบบประเมิน (นับจากทุกแบบประเมินในช่วงเวลาที่เลือก)
        </p>
      </CardHeader>
      <CardBody>
        <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1">
          {groups.map(({ group, color }) => (
            <span
              key={group}
              className="flex items-center gap-1.5 text-xs text-default-600"
            >
              <span
                className="size-2.5 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />
              {group}
            </span>
          ))}
        </div>

        <ResponsiveContainer height={chartHeight} width="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 4, right: 140, left: 4, bottom: 4 }}
          >
            <XAxis hide type="number" />
            <YAxis
              axisLine={false}
              dataKey="label"
              tick={{ fontSize: 11, fill: "#4b5563" }}
              tickLine={false}
              type="category"
              width={200}
            />
            <Tooltip
              cursor={{ fill: "rgba(0,0,0,0.04)" }}
              formatter={(value: number, _name: string, props) => [
                `${formatNumber(value)} ราย (${pct(value, total)})`,
                props.payload?.group ?? "",
              ]}
              labelFormatter={(label) => label}
            />
            <Bar
              barSize={26}
              dataKey="count"
              label={(props) => <BarCountLabel {...props} total={total} />}
              radius={[0, 6, 6, 0]}
            >
              {chartData.map((entry) => (
                <Cell key={entry.key} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-4 rounded-lg border border-default-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-default-100 text-default-600">
                <th className="text-left font-medium px-3 py-2">ปัญหา</th>
                <th className="text-left font-medium px-3 py-2 w-20">กลุ่ม</th>
                <th className="text-right font-medium px-3 py-2 w-24">
                  จำนวน (ราย)
                </th>
                <th className="text-right font-medium px-3 py-2 w-20">
                  สัดส่วน
                </th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((p) => (
                <tr
                  key={p.key}
                  className="border-t border-default-100 even:bg-default-50/50"
                >
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="size-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: p.color }}
                      />
                      <span className="text-default-700">{p.label}</span>
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-default-500">
                    {p.group}
                  </td>
                  <td className="text-right px-3 py-2 font-semibold tabular-nums">
                    {formatNumber(p.count)}
                  </td>
                  <td className="text-right px-3 py-2 tabular-nums text-default-500">
                    {pct(p.count, total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  );
}
