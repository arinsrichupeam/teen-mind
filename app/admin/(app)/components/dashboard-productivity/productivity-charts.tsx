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

type Props = {
  psychologists: PsychologistProductivityRow[];
  monthlyTrend: MonthlyProductivityPoint[];
};

const formatNumber = (value: number) => value.toLocaleString("th-TH");

export function ProductivityCharts({ psychologists, monthlyTrend }: Props) {
  const topPsychologists = psychologists.slice(0, 8).map((p) => ({
    name: p.name.length > 18 ? `${p.name.slice(0, 16)}…` : p.name,
    fullName: p.name,
    completed: p.completedSessions,
    assigned: p.assignedSessions,
    pending: p.soapPending + p.telemedPending,
  }));

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <Card className="border border-default-200 shadow-sm">
        <CardHeader className="flex flex-col items-start gap-1 pb-0">
          <h3 className="text-lg font-semibold">
            อันดับนักจิตวิทยา (ครั้งให้คำปรึกษาเสร็จสิ้น)
          </h3>
          <p className="text-xs text-default-500">
            แสดง 8 อันดับแรก เรียงตามจำนวนครั้งที่สรุปผลครบ
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
                  dataKey="completed"
                  fill="#22c55e"
                  name="เสร็จสิ้น"
                  radius={[0, 4, 4, 0]}
                />
                <Bar
                  dataKey="pending"
                  fill="#f59e0b"
                  name="รอดำเนินการ"
                  radius={[0, 4, 4, 0]}
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
                  name="ครั้งที่มอบหมาย"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  type="monotone"
                />
                <Line
                  dataKey="completed"
                  dot={{ r: 3 }}
                  name="เสร็จสิ้น"
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
