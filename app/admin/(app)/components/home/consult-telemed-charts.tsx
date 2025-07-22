"use client";

import { Card, CardBody, CardHeader } from "@heroui/react";

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

  // ใช้ข้อมูล questions โดยตรง ไม่ต้องกรองอายุอีกครั้ง
  const filteredQuestions = questions;

  // คำนวณสถิติจากข้อมูล questions ที่กรองแล้ว
  const stats = {
    total: filteredQuestions.length,
    consult: {
      yes: filteredQuestions.filter(
        (q) => q.status === 3 && q.consult && q.consult !== ""
      ).length,
      no: filteredQuestions.filter(
        (q) => q.consult && q.consult !== "" && q.status !== 3
      ).length,
      pending: filteredQuestions.filter((q) => !q.consult || q.consult === "")
        .length,
      notSpecified: 0, // ไม่ใช้ notSpecified เพราะรวมใน pending แล้ว
    },
    telemed: {
      scheduled: filteredQuestions.filter((q) => q.schedule_telemed !== null)
        .length,
      notScheduled: filteredQuestions.filter((q) => q.schedule_telemed === null)
        .length,
    },
    byResult: {
      green: {
        total: filteredQuestions.filter((q) => q.result === "Green").length,
        consult: filteredQuestions.filter(
          (q) =>
            q.result === "Green" &&
            q.status === 3 &&
            q.consult &&
            q.consult !== ""
        ).length,
        telemed: filteredQuestions.filter(
          (q) => q.result === "Green" && q.schedule_telemed !== null
        ).length,
        completed: filteredQuestions.filter(
          (q) => q.result === "Green" && q.status === 3
        ).length,
        inProgress: filteredQuestions.filter(
          (q) => q.result === "Green" && q.status !== 3
        ).length,
      },
      greenLow: {
        total: filteredQuestions.filter((q) => q.result === "Green-Low").length,
        consult: filteredQuestions.filter(
          (q) =>
            q.result === "Green-Low" &&
            q.status === 3 &&
            q.consult &&
            q.consult !== ""
        ).length,
        telemed: filteredQuestions.filter(
          (q) => q.result === "Green-Low" && q.schedule_telemed !== null
        ).length,
        completed: filteredQuestions.filter(
          (q) => q.result === "Green-Low" && q.status === 3
        ).length,
        inProgress: filteredQuestions.filter(
          (q) => q.result === "Green-Low" && q.status !== 3
        ).length,
      },
      yellow: {
        total: filteredQuestions.filter((q) => q.result === "Yellow").length,
        consult: filteredQuestions.filter(
          (q) =>
            q.result === "Yellow" &&
            q.status === 3 &&
            q.consult &&
            q.consult !== ""
        ).length,
        telemed: filteredQuestions.filter(
          (q) => q.result === "Yellow" && q.schedule_telemed !== null
        ).length,
        completed: filteredQuestions.filter(
          (q) => q.result === "Yellow" && q.status === 3
        ).length,
        inProgress: filteredQuestions.filter(
          (q) => q.result === "Yellow" && q.status !== 3
        ).length,
      },
      orange: {
        total: filteredQuestions.filter((q) => q.result === "Orange").length,
        consult: filteredQuestions.filter(
          (q) =>
            q.result === "Orange" &&
            q.status === 3 &&
            q.consult &&
            q.consult !== ""
        ).length,
        telemed: filteredQuestions.filter(
          (q) => q.result === "Orange" && q.schedule_telemed !== null
        ).length,
        completed: filteredQuestions.filter(
          (q) => q.result === "Orange" && q.status === 3
        ).length,
        inProgress: filteredQuestions.filter(
          (q) => q.result === "Orange" && q.status !== 3
        ).length,
      },
      red: {
        total: filteredQuestions.filter((q) => q.result === "Red").length,
        consult: filteredQuestions.filter(
          (q) =>
            q.result === "Red" &&
            q.status === 3 &&
            q.consult &&
            q.consult !== ""
        ).length,
        telemed: filteredQuestions.filter(
          (q) => q.result === "Red" && q.schedule_telemed !== null
        ).length,
        completed: filteredQuestions.filter(
          (q) => q.result === "Red" && q.status === 3
        ).length,
        inProgress: filteredQuestions.filter(
          (q) => q.result === "Red" && q.status !== 3
        ).length,
      },
    },
  };

  const consultTotal =
    stats.consult.yes + stats.consult.no + stats.consult.pending;
  const telemedTotal = stats.telemed.scheduled + stats.telemed.notScheduled;

  return (
    <div className="space-y-6">
      {/* แสดงจำนวนรวมเพื่อตรวจสอบ */}
      <Card className="bg-gray-50">
        <CardBody className="p-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              จำนวนรวมทั้งหมด (อายุ 12-18 ปี)
            </p>
            <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
            <p className="text-xs text-gray-500">
              รอดำเนินการ: {stats.consult.pending} | เข้าพบแล้ว: {stats.consult.yes} | ยังไม่เข้าพบ: {stats.consult.no}{" "}

            </p>
          </div>
        </CardBody>
      </Card>

      {/* สรุปสถิติการเข้าพบนักจิตวิทยา */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-yellow-500">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">รอนักจิตวิทยาดำเนินการ</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.consult.pending}{" "}
                  <span className="text-sm">
                    (
                    {consultTotal > 0
                      ? ((stats.consult.pending / consultTotal) * 100).toFixed(
                        1
                      )
                      : 0}
                    %)
                  </span>
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ให้คำปรึกษาแล้ว</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.consult.yes}{" "}
                  <span className="text-sm">
                    (
                    {consultTotal > 0
                      ? ((stats.consult.yes / consultTotal) * 100).toFixed(1)
                      : 0}
                    %)
                  </span>
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">รอให้คำปรึกษา</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.consult.no}{" "}
                  <span className="text-sm">
                    (
                    {consultTotal > 0
                      ? ((stats.consult.no / consultTotal) * 100).toFixed(1)
                      : 0}
                    %)
                  </span>
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* สรุปสถิติการ Telemed */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ยอดนัด Follow Up</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.telemed.scheduled}{" "}
                  <span className="text-sm">
                    (
                    {telemedTotal > 0
                      ? (
                          (stats.telemed.scheduled / telemedTotal) *
                          100
                        ).toFixed(1)
                      : 0}
                    %)
                  </span>
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  ยอดที่ยังไม่นัด Follow Up
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {stats.telemed.notScheduled}{" "}
                  <span className="text-sm">
                    (
                    {telemedTotal > 0
                      ? (
                          (stats.telemed.notScheduled / telemedTotal) *
                          100
                        ).toFixed(1)
                      : 0}
                    %)
                  </span>
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div> */}

      {/* สถิติแยกตามผลการประเมิน */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">
            สถิติการเข้าพบแยกตามผลการประเมิน
          </h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {Object.entries(stats.byResult).map(([result, data]) => {
              const resultColors = {
                green: {
                  bg: "bg-green-50",
                  border: "border-green-200",
                  text: "text-green-700",
                },
                greenLow: {
                  bg: "bg-emerald-50",
                  border: "border-emerald-200",
                  text: "text-emerald-700",
                },
                yellow: {
                  bg: "bg-yellow-50",
                  border: "border-yellow-200",
                  text: "text-yellow-700",
                },
                orange: {
                  bg: "bg-orange-50",
                  border: "border-orange-200",
                  text: "text-orange-700",
                },
                red: {
                  bg: "bg-red-50",
                  border: "border-red-200",
                  text: "text-red-700",
                },
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
                <div
                  key={result}
                  className={`p-4 rounded-lg border ${colors.bg} ${colors.border}`}
                >
                  <h4
                    className={`font-semibold ${colors.text} mb-2 text-nowrap`}
                  >
                    {resultLabels[result as keyof typeof resultLabels]}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-xs">
                      <span>ทั้งหมด:</span>
                      <span className="font-medium">{data.total}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>พบนักจิตวิทยา:</span>
                      <span className="font-medium text-green-600">
                        {data.consult}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex justify-between text-xs">
                        <span>เสร็จสิ้น:</span>
                        <span className="font-medium text-blue-600">
                          {data.completed}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>อยู่ระหว่างดำเนินการ:</span>
                        <span className="font-medium text-orange-600">
                          {data.inProgress}
                        </span>
                      </div>
                    </div>
                    {/* <div className="flex justify-between">
                      <span>Follow Up:</span>
                      <span className="font-medium text-blue-600">
                        {data.telemed}
                      </span>
                    </div> */}
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex justify-between text-xs">
                        <span>อัตราการให้คำปรึกษา:</span>
                        <span className="font-medium">
                          {data.total > 0
                            ? ((data.consult / data.total) * 100).toFixed(1)
                            : 0}
                          %
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
