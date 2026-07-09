"use client";

import type {
  MonthlyProductivityPoint,
  PsychologistProductivityRow,
} from "@/lib/dashboard/psychologist-productivity";

import { Card, CardBody, CardHeader } from "@heroui/react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PRODUCTIVITY_STATUS } from "./productivity-status-labels";

type Props = {
  psychologists: PsychologistProductivityRow[];
  monthlyTrend: MonthlyProductivityPoint[];
};

const formatNumber = (value: number) => value.toLocaleString("th-TH");

const { awaitingConsult, awaitingSummary, completed } = PRODUCTIVITY_STATUS;

export function ProductivityCharts({ psychologists, monthlyTrend }: Props) {
  const topPsychologists = psychologists.slice(0, 8).map((p) => ({
    name: p.name.length > 18 ? `${p.name.slice(0, 16)}…` : p.name,
    fullName: p.name,
    awaitingConsult: p.status1,
    awaitingSummary: p.status2,
    completed: p.status3,
  }));

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <Card className="border border-default-200 shadow-sm">
        <CardHeader className="flex flex-col items-start gap-1 pb-0">
          <h3 className="text-lg font-semibold">
            อันดับนักจิตวิทยา (ตามสถานะเคส)
          </h3>
          <p className="text-xs text-default-500">
            แสดง 8 อันดับแรก เรียงตามจำนวนเคสที่{completed}
          </p>
        </CardHeader>
        <CardBody>
          {topPsychologists.length === 0 ? (
            <div className="py-16 text-center text-default-500">
              ไม่มีข้อมูล
            </div>
          ) : (
            <ResponsiveContainer height={320} width="100%">
              <BarChart
                data={topPsychologists}
                layout="vertical"
                margin={{ left: 8, right: 16, top: 8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis tickFormatter={formatNumber} type="number" />
                <YAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  type="category"
                  width={110}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    formatNumber(value),
                    name,
                  ]}
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload?.fullName ?? ""
                  }
                />
                <Legend />
                <Bar
                  dataKey="awaitingConsult"
                  fill="#f59e0b"
                  name={awaitingConsult}
                  radius={[0, 4, 4, 0]}
                  stackId="status"
                />
                <Bar
                  dataKey="awaitingSummary"
                  fill="#3b82f6"
                  name={awaitingSummary}
                  radius={[0, 4, 4, 0]}
                  stackId="status"
                />
                <Bar
                  dataKey="completed"
                  fill="#22c55e"
                  name={completed}
                  radius={[0, 4, 4, 0]}
                  stackId="status"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardBody>
      </Card>

      <Card className="border border-default-200 shadow-sm">
        <CardHeader className="flex flex-col items-start gap-1 pb-0">
          <h3 className="text-lg font-semibold">
            แนวโน้มการให้คำปรึกษารายเดือน
          </h3>
          <p className="text-xs text-default-500">
            นับตามวันนัดพบ (หากไม่มีใช้วันที่สร้างแบบประเมิน)
          </p>
        </CardHeader>
        <CardBody>
          {monthlyTrend.length === 0 ? (
            <div className="py-16 text-center text-default-500">
              ไม่มีข้อมูล
            </div>
          ) : (
            <ResponsiveContainer height={320} width="100%">
              <LineChart
                data={monthlyTrend}
                margin={{ left: 0, right: 16, top: 8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="monthLabel" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={formatNumber} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    formatNumber(value),
                    name,
                  ]}
                />
                <Legend />
                <Line
                  dataKey="assigned"
                  dot={{ r: 3 }}
                  name="รอบที่มอบหมาย"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  type="monotone"
                />
                <Line
                  dataKey="completed"
                  dot={{ r: 3 }}
                  name={`รอบ${completed}`}
                  stroke="#22c55e"
                  strokeWidth={2}
                  type="monotone"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
