"use client";

import { Card, CardBody, CardHeader, Chip } from "@heroui/react";
import { QuestionsData } from "@/types";

interface ConsultTelemedChartsProps {
  questions: QuestionsData[];
}

export function ConsultTelemedCharts({ questions }: ConsultTelemedChartsProps) {

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
      pending: questions.filter(q => q.status === 0).length,
      notSpecified: questions.filter(q => q.consult === "No").length,
    },
    telemed: {
      scheduled: questions.filter(q => q.schedule_telemed !== null).length,
      notScheduled: questions.filter(q => q.schedule_telemed === null).length,
    },
    byResult: {
      green: {
        total: questions.filter(q => q.result === "Green").length,
        consult: questions.filter(q => q.result === "Green" && q.consult && q.consult !== "").length,
        telemed: questions.filter(q => q.result === "Green" && q.schedule_telemed !== null).length,
      },
      greenLow: {
        total: questions.filter(q => q.result === "Green-Low").length,
        consult: questions.filter(q => q.result === "Green-Low" && q.consult && q.consult !== "").length,
        telemed: questions.filter(q => q.result === "Green-Low" && q.schedule_telemed !== null).length,
      },
      yellow: {
        total: questions.filter(q => q.result === "Yellow").length,
        consult: questions.filter(q => q.result === "Yellow" && q.consult && q.consult !== "").length,
        telemed: questions.filter(q => q.result === "Yellow" && q.schedule_telemed !== null).length,
      },
      orange: {
        total: questions.filter(q => q.result === "Orange").length,
        consult: questions.filter(q => q.result === "Orange" && q.consult && q.consult !== "").length,
        telemed: questions.filter(q => q.result === "Orange" && q.schedule_telemed !== null).length,
      },
      red: {
        total: questions.filter(q => q.result === "Red").length,
        consult: questions.filter(q => q.result === "Red" && q.consult && q.consult !== "").length,
        telemed: questions.filter(q => q.result === "Red" && q.schedule_telemed !== null).length,
      },
    },
  };

  const consultTotal = stats.consult.yes + stats.consult.no + stats.consult.pending + stats.consult.notSpecified;
  const telemedTotal = stats.telemed.scheduled + stats.telemed.notScheduled;

  return (
    <div className="space-y-6">
      {/* สรุปสถิติการเข้าพบนักจิตวิทยา */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">เข้าพบแล้ว</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.consult.yes}
                </p>
                <p className="text-xs text-gray-500">
                  {consultTotal > 0 ? ((stats.consult.yes / consultTotal) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <Chip color="success" variant="flat" size="sm">
                เข้าพบแล้ว
              </Chip>
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ยังไม่เข้าพบ</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.consult.no}
                </p>
                <p className="text-xs text-gray-500">
                  {consultTotal > 0 ? ((stats.consult.no / consultTotal) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <Chip color="danger" variant="flat" size="sm">
                ไม่เข้าพบ
              </Chip>
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">รอดำเนินการ</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.consult.pending}
                </p>
                <p className="text-xs text-gray-500">
                  {consultTotal > 0 ? ((stats.consult.pending / consultTotal) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <Chip color="warning" variant="flat" size="sm">
                รอ
              </Chip>
            </div>
          </CardBody>
        </Card>

        {/* <Card className="border-l-4 border-l-gray-500">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ไม่ระบุ (No)</p>
                <p className="text-2xl font-bold text-gray-600">
                  {stats.consult.notSpecified}
                </p>
                <p className="text-xs text-gray-500">
                  {consultTotal > 0 ? ((stats.consult.notSpecified / consultTotal) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <Chip color="default" variant="flat" size="sm">
                No
              </Chip>
            </div>
          </CardBody>
        </Card> */}
      </div>

      {/* สรุปสถิติการ Telemed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">นัด Telemed แล้ว (มีข้อมูล)</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.telemed.scheduled}
                </p>
                <p className="text-xs text-gray-500">
                  {telemedTotal > 0 ? ((stats.telemed.scheduled / telemedTotal) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <Chip color="primary" variant="flat" size="sm">
                นัดแล้ว
              </Chip>
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ยังไม่นัด Telemed (ไม่มีข้อมูล)</p>
                <p className="text-2xl font-bold text-orange-600">
                  {stats.telemed.notScheduled}
                </p>
                <p className="text-xs text-gray-500">
                  {telemedTotal > 0 ? ((stats.telemed.notScheduled / telemedTotal) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <Chip color="secondary" variant="flat" size="sm">
                ยังไม่นัด
              </Chip>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* สถิติแยกตามผลการประเมิน */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">สถิติการเข้าพบแยกตามผลการประเมิน</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {Object.entries(stats.byResult).map(([result, data]) => {
              const resultColors = {
                green: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700" },
                greenLow: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700" },
                yellow: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700" },
                orange: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700" },
                red: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700" },
              };
              
              const colors = resultColors[result as keyof typeof resultColors];
              const resultLabels = {
                green: "ไม่พบความเสี่ยง",
                greenLow: "พบความเสี่ยงเล็กน้อย",
                yellow: "พบความเสี่ยงปานกลาง",
                orange: "พบความเสี่ยงมาก",
                red: "พบความเสี่ยงรุนแรง",
              };

              return (
                <div key={result} className={`p-4 rounded-lg border ${colors.bg} ${colors.border}`}>
                  <h4 className={`font-semibold ${colors.text} mb-2`}>
                    {resultLabels[result as keyof typeof resultLabels]}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>ทั้งหมด:</span>
                      <span className="font-medium">{data.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>เข้าพบ:</span>
                      <span className="font-medium text-green-600">{data.consult}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Telemed:</span>
                      <span className="font-medium text-blue-600">{data.telemed}</span>
                    </div>
                                         <div className="pt-2 border-t border-gray-200">
                       <div className="flex justify-between text-xs">
                         <span>อัตราการเข้าพบ:</span>
                         <span className="font-medium">
                           {data.total > 0 ? ((data.consult / data.total) * 100).toFixed(1) : 0}%
                         </span>
                       </div>
                       <div className="flex justify-between text-xs mt-1">
                         <span>คนที่มีข้อมูล:</span>
                         <span className="font-medium text-green-600">
                           {data.consult} คน
                         </span>
                       </div>
                       <div className="flex justify-between text-xs mt-1">
                         <span>คนที่ไม่มีข้อมูล:</span>
                         <span className="font-medium text-red-600">
                           {data.total - data.consult} คน
                         </span>
                       </div>
                     </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>
    </div>
  );
} 