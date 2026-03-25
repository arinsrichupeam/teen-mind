"use client";

import { Card, CardBody, CardHeader } from "@heroui/react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

type RiskSummary = {
  label: string | null;
  totalUsers: number;
  green: number;
  greenLow: number;
  yellow: number;
  orange: number;
  red: number;
};

type Props = {
  summary: RiskSummary;
};

const COLORS = {
  green: "#22c55e",
  greenLow: "#4ade80",
  yellow: "#eab308",
  orange: "#f97316",
  red: "#ef4444",
};

export function UsageRiskMonthlyChart({ summary }: Props) {
  const pieTitle = summary.label ?? "ช่วงที่เลือก";
  const pieData = [
    { name: "ไม่พบความเสี่ยง", value: summary.green, color: COLORS.green },
    {
      name: "ความเสี่ยงเล็กน้อย",
      value: summary.greenLow,
      color: COLORS.greenLow,
    },
    { name: "ความเสี่ยงปานกลาง", value: summary.yellow, color: COLORS.yellow },
    { name: "ความเสี่ยงมาก", value: summary.orange, color: COLORS.orange },
    { name: "ความเสี่ยงรุนแรง", value: summary.red, color: COLORS.red },
  ];

  const totalRiskUsers =
    summary.green +
    summary.greenLow +
    summary.yellow +
    summary.orange +
    summary.red;

  if (totalRiskUsers === 0) return null;

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">
          กราฟสถิติการเข้าใช้งานตามระดับความเสี่ยง : {pieTitle}
        </h3>
      </CardHeader>
      <CardBody>
        <div className="text-sm text-default-600 mb-2">
          จำนวนผู้ใช้ที่มีแบบประเมินทั้งหมด:{" "}
          {totalRiskUsers.toLocaleString("th-TH")}
        </div>
        <ResponsiveContainer height={320} width="100%">
          <PieChart>
            <Tooltip
              formatter={(value: number, name: string) => [
                `${value.toLocaleString("th-TH")}`,
                `${name}`,
              ]}
            />
            <Legend />
            <Pie
              data={pieData}
              dataKey="value"
              innerRadius={65}
              label={({ name, value }) =>
                typeof value === "number" && value > 0 ? `${name}` : ""
              }
              nameKey="name"
              outerRadius={110}
              paddingAngle={4}
            >
              {pieData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
}
