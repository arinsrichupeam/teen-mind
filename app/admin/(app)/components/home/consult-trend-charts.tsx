"use client";

import { Card, CardBody, CardHeader } from "@heroui/react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { QuestionsData } from "@/types";

interface ConsultTrendChartsProps {
  questions: QuestionsData[];
}

export function ConsultTrendCharts({ questions }: ConsultTrendChartsProps) {

  if (!questions || questions.length === 0) {
    return (
      <div className="text-center text-gray-500">
        ไม่มีข้อมูลการเข้าพบนักจิตวิทยา
      </div>
    );
  }

  // คำนวณสถิติจากข้อมูล questions
  const stats = {
    total: questions.length,
    consult: {
      yes: questions.filter(q => q.consult && q.consult !== "").length,
      no: questions.filter(q => !q.consult || q.consult === "").length,
      pending: questions.filter(q => q.status === 1).length,
      notSpecified: questions.filter(q => q.consult === "No").length,
    },
    telemed: {
      scheduled: questions.filter(q => q.schedule_telemed !== null).length,
      notScheduled: questions.filter(q => q.schedule_telemed === null).length,
    },
  };

  // คำนวณข้อมูลรายเดือน
  const monthlyData: Record<string, { consult: number; telemed: number; total: number }> = {};
  
  questions.forEach(question => {
    const month = new Date(question.createdAt).toISOString().slice(0, 7); // YYYY-MM format
    
    if (!monthlyData[month]) {
      monthlyData[month] = { consult: 0, telemed: 0, total: 0 };
    }
    
    monthlyData[month].total++;
    if (question.consult && question.consult !== "") {
      monthlyData[month].consult++;
    }
    if (question.schedule_telemed !== null) {
      monthlyData[month].telemed++;
    }
  });

  // แปลงข้อมูลรายเดือนให้เป็นรูปแบบที่เหมาะสมสำหรับกราฟ
  const chartData = Object.entries(monthlyData)
    .map(([month, data]) => ({
      month: month,
      consult: data.consult,
      telemed: data.telemed,
      total: data.total,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // แปลงชื่อเดือนเป็นภาษาไทย
  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const monthNames = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  const chartDataWithLabels = chartData.map(item => ({
    ...item,
    monthLabel: formatMonth(item.month),
  }));

  return (
    <div className="space-y-6">
      {/* กราฟแท่งแสดงแนวโน้มรายเดือน */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">แนวโน้มการเข้าพบนักจิตวิทยารายเดือน</h3>
        </CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartDataWithLabels}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="monthLabel" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis fontSize={12} />
              <Tooltip 
                formatter={(value, name) => [
                  value, 
                  name === 'consult' ? 'เข้าพบ' : name === 'telemed' ? 'Telemed' : 'ทั้งหมด'
                ]}
                labelFormatter={(label) => `เดือน: ${label}`}
              />
              <Legend 
                formatter={(value) => 
                  value === 'consult' ? 'เข้าพบ' : value === 'telemed' ? 'Telemed' : 'ทั้งหมด'
                }
              />
              <Bar dataKey="consult" fill="#10b981" name="เข้าพบ" />
              <Bar dataKey="telemed" fill="#3b82f6" name="Telemed" />
              <Bar dataKey="total" fill="#6b7280" name="ทั้งหมด" />
            </BarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      {/* กราฟเส้นแสดงแนวโน้ม */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">แนวโน้มการเข้าพบนักจิตวิทยา (กราฟเส้น)</h3>
        </CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartDataWithLabels}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="monthLabel" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis fontSize={12} />
              <Tooltip 
                formatter={(value, name) => [
                  value, 
                  name === 'consult' ? 'เข้าพบ' : name === 'telemed' ? 'Telemed' : 'ทั้งหมด'
                ]}
                labelFormatter={(label) => `เดือน: ${label}`}
              />
              <Legend 
                formatter={(value) => 
                  value === 'consult' ? 'เข้าพบ' : value === 'telemed' ? 'Telemed' : 'ทั้งหมด'
                }
              />
              <Line 
                type="monotone" 
                dataKey="consult" 
                stroke="#10b981" 
                strokeWidth={3}
                name="เข้าพบ"
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="telemed" 
                stroke="#3b82f6" 
                strokeWidth={3}
                name="Telemed"
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="#6b7280" 
                strokeWidth={2}
                name="ทั้งหมด"
                dot={{ fill: '#6b7280', strokeWidth: 2, r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      {/* สรุปสถิติรวม */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-green-50 to-green-100">
          <CardBody className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">อัตราการเข้าพบเฉลี่ย (มีข้อมูล)</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.total > 0 ? ((stats.consult.yes / stats.total) * 100).toFixed(1) : 0}%
              </p>
                              <p className="text-xs text-gray-500">
                  {stats.consult.yes} คนที่มีข้อมูล จาก {stats.total} คน
                </p>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
          <CardBody className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">อัตราการนัด Telemed (มีข้อมูล)</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.total > 0 ? ((stats.telemed.scheduled / stats.total) * 100).toFixed(1) : 0}%
              </p>
                              <p className="text-xs text-gray-500">
                  {stats.telemed.scheduled} คนที่มีข้อมูล จาก {stats.total} คน
                </p>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100">
          <CardBody className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">อัตราการรอดำเนินการ (Status = 1)</p>
              <p className="text-2xl font-bold text-purple-600">
                {stats.total > 0 ? ((stats.consult.pending / stats.total) * 100).toFixed(1) : 0}%
              </p>
                              <p className="text-xs text-gray-500">
                  {stats.consult.pending} คน (Status = 1)
                </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
} 