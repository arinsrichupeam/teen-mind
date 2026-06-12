"use client";

import { useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Spinner,
  Progress,
} from "@heroui/react";
import {
  CalculatorIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import useSWR from "swr";

import { AuthGuard } from "./auth-guard";

import Loading from "@/app/loading";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface RecalculateStats {
  totalQuestions: number;
  ageCutoff: number;
  mismatchSummary: {
    wrongScale: number;
    missingAddon: number;
    missingAge: number;
    total: number;
  };
  ageBreakdown: {
    under18: number;
    age18AndOver: number;
    unspecified: number;
  };
  scaleByStructure: {
    nineq: number;
    phqa: number;
  };
  scaleByAge: {
    phqa: number;
    nineq: number;
  };
  resultWouldChange: number;
  resultStats: {
    result: string;
    count: number;
  }[];
  statusStats: {
    status: number;
    count: number;
  }[];
}

type MismatchIssue = "wrong_scale_for_age" | "missing_addon" | "missing_age";

interface RecalculateMismatch {
  questionId: string;
  profileId: string;
  age: number | null;
  issue: MismatchIssue;
  previousResult: string;
  newResult: string;
}

interface RecalculateResponse {
  success: boolean;
  message: string;
  summary: {
    total: number;
    success: number;
    error: number;
  };
  mismatches?: RecalculateMismatch[];
  mismatchSummary?: {
    wrongScale: number;
    missingAddon: number;
    missingAge: number;
  };
  errors?: string[];
}

const MISMATCH_LABELS: Record<MismatchIssue, string> = {
  wrong_scale_for_age: "ชุดแบบประเมินไม่ตรงอายุ",
  missing_addon: "ขาด PHQ-A Addon",
  missing_age: "ไม่มีวันเกิด",
};

function exportMismatchesCsv(mismatches: RecalculateMismatch[]) {
  const header = "questionId,profileId,age,issue,previousResult,newResult";
  const rows = mismatches.map((m) =>
    [
      m.questionId,
      m.profileId,
      m.age ?? "",
      m.issue,
      m.previousResult,
      m.newResult,
    ].join(",")
  );

  const blob = new Blob([[header, ...rows].join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `assessment-mismatches-${Date.now()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function RecalculatePHQAPage() {
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [isRecalculatingNew, setIsRecalculatingNew] = useState(false);
  const [recalculateResult, setRecalculateResult] =
    useState<RecalculateResponse | null>(null);
  const [progress, setProgress] = useState(0);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);

  // ดึงข้อมูลสถิติ
  const {
    data: stats,
    isLoading: isLoadingStats,
    mutate: mutateStats,
  } = useSWR<{ success: boolean; data: RecalculateStats }>(
    "/api/question/recalculate",
    fetcher
  );

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    setRecalculateResult(null);
    setProgress(0);
    setShowSuccessNotification(false);

    try {
      // จำลอง progress bar
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);

            return prev;
          }

          return prev + 10;
        });
      }, 200);

      const response = await fetch("/api/question/recalculate", {
        method: "POST",
      });
      const result: RecalculateResponse = await response.json();

      clearInterval(progressInterval);
      setProgress(100);

      setRecalculateResult(result);

      // รีเฟรชข้อมูลสถิติหลังจาก recalculation
      if (result.success) {
        mutateStats();
        setShowSuccessNotification(true);
        // ซ่อนการแจ้งเตือนหลังจาก 5 วินาที
        setTimeout(() => setShowSuccessNotification(false), 5000);
      }
    } catch (error) {
      setRecalculateResult({
        success: false,
        message: "เกิดข้อผิดพลาดในการเชื่อมต่อ" + error,
        summary: { total: 0, success: 0, error: 1 },
      });
    } finally {
      setIsRecalculating(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const handleRecalculateNew = async () => {
    setIsRecalculatingNew(true);
    setRecalculateResult(null);
    setProgress(0);
    setShowSuccessNotification(false);

    try {
      // จำลอง progress bar
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);

            return prev;
          }

          return prev + 10;
        });
      }, 200);

      const response = await fetch("/api/question/recalculate/update-status", {
        method: "POST",
      });
      const result: RecalculateResponse = await response.json();

      clearInterval(progressInterval);
      setProgress(100);

      setRecalculateResult(result);

      // รีเฟรชข้อมูลสถิติหลังจากอัปเดตสถานะ
      if (result.success) {
        mutateStats();
        setShowSuccessNotification(true);
        // ซ่อนการแจ้งเตือนหลังจาก 5 วินาที
        setTimeout(() => setShowSuccessNotification(false), 5000);
      }
    } catch (error) {
      setRecalculateResult({
        success: false,
        message: "เกิดข้อผิดพลาดในการอัปเดตสถานะ: " + error,
        summary: { total: 0, success: 0, error: 1 },
      });
    } finally {
      setIsRecalculatingNew(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const getResultText = (result: string) => {
    switch (result) {
      case "Green":
        return "ไม่พบความเสี่ยง";
      case "Green-Low":
        return "พบความเสี่ยงเล็กน้อย";
      case "Yellow":
        return "พบความเสี่ยงปานกลาง";
      case "Orange":
        return "พบความเสี่ยงมาก";
      case "Red":
        return "พบความเสี่ยงรุนแรง";
      default:
        return result;
    }
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case 0:
        return "รอระบุ HN";
      case 1:
        return "รอให้คำปรึกษา";
      case 2:
        return "รอสรุปผลการให้คำปรึกษา";
      case 3:
        return "เสร็จสิ้น";
      default:
        return `สถานะ ${status}`;
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0:
        return {
          bg: "bg-gray-100",
          text: "text-gray-700",
          border: "border-gray-200",
        };
      case 1:
        return {
          bg: "bg-blue-100",
          text: "text-blue-700",
          border: "border-blue-200",
        };
      case 2:
        return {
          bg: "bg-amber-100",
          text: "text-amber-700",
          border: "border-amber-200",
        };
      case 3:
        return {
          bg: "bg-emerald-100",
          text: "text-emerald-700",
          border: "border-emerald-200",
        };
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-700",
          border: "border-gray-200",
        };
    }
  };

  // ฟังก์ชันเรียงลำดับผลลัพธ์ตามลำดับที่กำหนด
  const sortResultStats = (stats: { result: string; count: number }[]) => {
    const order = ["Green", "Green-Low", "Yellow", "Orange", "Red"];

    return stats.sort((a, b) => {
      const aIndex = order.indexOf(a.result);
      const bIndex = order.indexOf(b.result);

      return aIndex - bIndex;
    });
  };

  if (isLoadingStats) {
    return <Loading />;
  }

  return (
    <AuthGuard allowedRoles={[4]} redirectTo="/admin">
      <div className="max-w-[95rem] px-4 lg:px-6 mx-auto w-full flex flex-col gap-3 min-h-screen py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-xl font-semibold">
                คำนวณคะแนน PHQ-A / 9Q ตามอายุ
              </h3>
              <p className="text-sm text-gray-600">
                อายุต่ำกว่า 18 ปีใช้เกณฑ์ PHQ-A · อายุ 18 ปีขึ้นไปใช้เกณฑ์ 9Q
              </p>
            </div>
          </div>
        </div>

        {/* สถิติปัจจุบัน — สำหรับตัดสินใจ recalculate */}
        <Card className="w-full shadow-lg">
          <CardHeader className="flex gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
            <div className="flex flex-col">
              <p className="text-md font-semibold text-blue-800">
                สถิติปัจจุบัน (ก่อน recalculate)
              </p>
              <p className="text-small text-blue-600">
                วิเคราะห์จากข้อมูลในฐานข้อมูล ณ ตอนนี้ — ยังไม่มีการแก้ไข
              </p>
            </div>
          </CardHeader>
          <CardBody className="p-6">
            {stats?.success && stats.data ? (
              <div className="space-y-6">
                {/* สรุปการตัดสินใจ */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-default-50 border border-default-200 shadow-md">
                    <CardBody className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <InformationCircleIcon className="size-6 text-default-600 shrink-0" />
                        <div>
                          <p className="text-xs text-default-500">
                            แบบประเมินทั้งหมด
                          </p>
                          <p className="text-2xl font-semibold tabular-nums">
                            {stats.data.totalQuestions.toLocaleString("th-TH")}
                          </p>
                        </div>
                      </div>
                    </CardBody>
                  </Card>

                  <Card
                    className={
                      stats.data.resultWouldChange > 0
                        ? "bg-warning-50 border border-warning-300 shadow-md"
                        : "bg-success-50 border border-success-200 shadow-md"
                    }
                  >
                    <CardBody className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <CalculatorIcon
                          className={`size-6 shrink-0 ${
                            stats.data.resultWouldChange > 0
                              ? "text-warning-700"
                              : "text-success-600"
                          }`}
                        />
                        <div>
                          <p className="text-xs text-default-600">
                            ผลลัพธ์จะเปลี่ยนหลัง recalculate
                          </p>
                          <p className="text-2xl font-semibold tabular-nums">
                            {stats.data.resultWouldChange.toLocaleString(
                              "th-TH"
                            )}
                          </p>
                        </div>
                      </div>
                    </CardBody>
                  </Card>

                  <Card
                    className={
                      stats.data.mismatchSummary.total > 0
                        ? "bg-danger-50 border border-danger-200 shadow-md"
                        : "bg-success-50 border border-success-200 shadow-md"
                    }
                  >
                    <CardBody className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <ExclamationTriangleIcon
                          className={`size-6 shrink-0 ${
                            stats.data.mismatchSummary.total > 0
                              ? "text-danger-600"
                              : "text-success-600"
                          }`}
                        />
                        <div>
                          <p className="text-xs text-default-600">
                            โครงสร้างข้อมูลไม่ตรงอายุ
                          </p>
                          <p className="text-2xl font-semibold tabular-nums">
                            {stats.data.mismatchSummary.total.toLocaleString(
                              "th-TH"
                            )}
                          </p>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </div>

                {stats.data.resultWouldChange > 0 ||
                stats.data.mismatchSummary.total > 0 ? (
                  <p className="rounded-lg border border-warning-200 bg-warning-50 px-3 py-2 text-sm text-warning-800">
                    แนะนำให้รัน recalculate — มี{" "}
                    {stats.data.resultWouldChange > 0
                      ? `${stats.data.resultWouldChange.toLocaleString("th-TH")} รายที่ผลลัพธ์จะเปลี่ยน`
                      : null}
                    {stats.data.resultWouldChange > 0 &&
                    stats.data.mismatchSummary.total > 0
                      ? " และ "
                      : null}
                    {stats.data.mismatchSummary.total > 0
                      ? `${stats.data.mismatchSummary.total.toLocaleString("th-TH")} รายที่โครงสร้างไม่ตรงเกณฑ์อายุ ${stats.data.ageCutoff} ปี`
                      : null}
                  </p>
                ) : (
                  <p className="rounded-lg border border-success-200 bg-success-50 px-3 py-2 text-sm text-success-800">
                    ข้อมูลสอดคล้องกับเกณฑ์อายุ {stats.data.ageCutoff} ปีแล้ว —
                    ไม่จำเป็นต้อง recalculate เว้นแต่ต้องการอัปเดตซ้ำ
                  </p>
                )}

                {/* รายละเอียด mismatch */}
                <div>
                  <h4 className="text-md font-semibold mb-3">
                    โครงสร้างข้อมูล vs เกณฑ์อายุ
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Card className="bg-warning-50/80 border border-warning-200">
                      <CardBody className="py-3 px-4 text-center">
                        <p className="text-2xl font-semibold tabular-nums text-warning-800">
                          {stats.data.mismatchSummary.wrongScale}
                        </p>
                        <p className="text-xs text-warning-700">
                          ชุดแบบไม่ตรงอายุ (มี 9Q แต่ &lt;18 หรือไม่มี 9Q แต่
                          ≥18)
                        </p>
                      </CardBody>
                    </Card>
                    <Card className="bg-warning-50/80 border border-warning-200">
                      <CardBody className="py-3 px-4 text-center">
                        <p className="text-2xl font-semibold tabular-nums text-warning-800">
                          {stats.data.mismatchSummary.missingAddon}
                        </p>
                        <p className="text-xs text-warning-700">
                          อายุ &lt;18 แต่ไม่มี PHQ-A Addon
                        </p>
                      </CardBody>
                    </Card>
                    <Card className="bg-default-100 border border-default-200">
                      <CardBody className="py-3 px-4 text-center">
                        <p className="text-2xl font-semibold tabular-nums">
                          {stats.data.mismatchSummary.missingAge}
                        </p>
                        <p className="text-xs text-default-600">
                          ไม่มีวันเกิด (ใช้สเกลจากโครงสร้าง DB)
                        </p>
                      </CardBody>
                    </Card>
                  </div>
                </div>

                {/* ช่วงอายุ + ชุดแบบ */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-md font-semibold mb-3">
                      ช่วงอายุ ณ วันทำแบบประเมิน
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      <Card className="bg-sky-50 border border-sky-200">
                        <CardBody className="py-3 px-3 text-center">
                          <p className="text-xl font-semibold tabular-nums text-sky-800">
                            {stats.data.ageBreakdown.under18}
                          </p>
                          <p className="text-xs text-sky-700">
                            ต่ำกว่า {stats.data.ageCutoff} ปี
                            <br />
                            <span className="text-default-500">
                              ควรใช้ PHQ-A
                            </span>
                          </p>
                        </CardBody>
                      </Card>
                      <Card className="bg-violet-50 border border-violet-200">
                        <CardBody className="py-3 px-3 text-center">
                          <p className="text-xl font-semibold tabular-nums text-violet-800">
                            {stats.data.ageBreakdown.age18AndOver}
                          </p>
                          <p className="text-xs text-violet-700">
                            {stats.data.ageCutoff} ปีขึ้นไป
                            <br />
                            <span className="text-default-500">ควรใช้ 9Q</span>
                          </p>
                        </CardBody>
                      </Card>
                      <Card className="bg-default-100 border border-default-200">
                        <CardBody className="py-3 px-3 text-center">
                          <p className="text-xl font-semibold tabular-nums">
                            {stats.data.ageBreakdown.unspecified}
                          </p>
                          <p className="text-xs text-default-600">
                            ไม่ระบุอายุ
                          </p>
                        </CardBody>
                      </Card>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-md font-semibold mb-3">
                      ชุดแบบในฐานข้อมูล (โครงสร้างจริง)
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <Card className="bg-default-50 border border-default-200">
                        <CardBody className="py-3 px-4 text-center">
                          <p className="text-xl font-semibold tabular-nums">
                            {stats.data.scaleByStructure.phqa}
                          </p>
                          <p className="text-xs text-default-600">
                            ไม่มีแถว 9Q (PHQ-A path)
                          </p>
                        </CardBody>
                      </Card>
                      <Card className="bg-default-50 border border-default-200">
                        <CardBody className="py-3 px-4 text-center">
                          <p className="text-xl font-semibold tabular-nums">
                            {stats.data.scaleByStructure.nineq}
                          </p>
                          <p className="text-xs text-default-600">
                            มีแถว 9Q (9Q path)
                          </p>
                        </CardBody>
                      </Card>
                    </div>
                    {stats.data.mismatchSummary.wrongScale > 0 && (
                      <p className="mt-2 text-xs text-warning-700">
                        ชุดแบบในฐานข้อมูลไม่ตรงกับช่วงอายุ{" "}
                        {stats.data.mismatchSummary.wrongScale} ราย —
                        recalculate จะปรับผลลัพธ์ตามเกณฑ์อายุ
                        แต่ไม่ย้ายโครงสร้างข้อมูล
                      </p>
                    )}
                  </div>
                </div>

                {/* ผลลัพธ์ที่เก็บอยู่ (ก่อน recalculate) */}
                <div>
                  <h4 className="text-md font-semibold mb-3">
                    ผลลัพธ์ที่เก็บอยู่ในฐานข้อมูล (ก่อน recalculate)
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {sortResultStats(stats.data.resultStats).map((stat) => {
                      let bgColor = "bg-gray-100";
                      let textColor = "text-gray-700";
                      let borderColor = "border-gray-200";

                      switch (stat.result) {
                        case "Green":
                          bgColor = "bg-green-100";
                          textColor = "text-green-700";
                          borderColor = "border-green-200";
                          break;
                        case "Green-Low":
                          bgColor = "bg-green-50";
                          textColor = "text-green-600";
                          borderColor = "border-green-200";
                          break;
                        case "Yellow":
                          bgColor = "bg-warning-100";
                          textColor = "text-warning-700";
                          borderColor = "border-warning-200";
                          break;
                        case "Orange":
                          bgColor = "bg-orange-100";
                          textColor = "text-orange-700";
                          borderColor = "border-orange-200";
                          break;
                        case "Red":
                          bgColor = "bg-red-100";
                          textColor = "text-danger-700";
                          borderColor = "border-red-200";
                          break;
                      }

                      return (
                        <Card
                          key={stat.result}
                          className={`${bgColor} ${borderColor}`}
                        >
                          <CardBody className="py-3 px-3">
                            <div className="flex flex-col items-center gap-1">
                              <span
                                className={`text-xs text-center ${textColor}`}
                              >
                                {getResultText(stat.result)}
                              </span>
                              <span className="text-lg font-semibold tabular-nums">
                                {stat.count}
                              </span>
                            </div>
                          </CardBody>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                {/* สถานะติดตาม (ข้อมูลเสริม) */}
                {stats.data.statusStats.length > 0 && (
                  <details className="rounded-lg border border-default-200 bg-default-50 px-4 py-3">
                    <summary className="cursor-pointer text-sm font-medium text-default-700">
                      สถานะการติดตาม (ไม่เกี่ยวกับการ recalculate คะแนน)
                    </summary>
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                      {stats.data.statusStats
                        .sort((a, b) => a.status - b.status)
                        .map((stat) => {
                          const { bg, text, border } = getStatusColor(
                            stat.status
                          );

                          return (
                            <Card
                              key={stat.status}
                              className={`${bg} ${border}`}
                            >
                              <CardBody className="py-3 px-3 text-center">
                                <span className={`text-xs ${text} block mb-1`}>
                                  {getStatusText(stat.status)}
                                </span>
                                <span className="text-lg font-semibold tabular-nums">
                                  {stat.count}
                                </span>
                              </CardBody>
                            </Card>
                          );
                        })}
                    </div>
                  </details>
                )}
              </div>
            ) : (
              <div className="text-center text-default-500">
                ไม่สามารถโหลดข้อมูลสถิติได้
              </div>
            )}
          </CardBody>
        </Card>

        {/* ปุ่ม Recalculate */}
        <Card className="w-full shadow-lg">
          <CardHeader className="flex gap-3 bg-gradient-to-r from-warning-50 to-orange-50 p-4">
            <div className="flex flex-col">
              <p className="text-md font-semibold text-warning-800">
                คำนวณคะแนนและสถานะใหม่
              </p>
              <p className="text-small text-warning-600">
                คำนวณผล PHQ-A / 9Q ตามอายุ และอัปเดตสถานะติดตามแยกกัน
              </p>
            </div>
          </CardHeader>
          <CardBody className="p-6">
            <div className="space-y-4">
              {/* Progress Bar */}
              {(isRecalculating || isRecalculatingNew) && (
                <Card className="bg-warning-50 border border-warning-200 shadow-lg">
                  <CardBody className="p-5">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-1.5 bg-warning-100 rounded-lg">
                          <ClockIcon className="size-4 text-warning" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-warning-700 font-medium">
                              กำลังประมวลผล...
                            </span>
                            <span className="text-warning-700 font-semibold">
                              {progress}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <Progress
                        className="w-full"
                        color="warning"
                        value={progress}
                      />
                    </div>
                  </CardBody>
                </Card>
              )}

              {/* Success Notification */}
              {showSuccessNotification && (
                <Card className="bg-success-50 border border-success-200 shadow-lg">
                  <CardBody className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-success-100 rounded-lg">
                        <CheckCircleIcon className="size-5 text-success" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-success-800">
                          ดำเนินการเสร็จสิ้น!
                        </p>
                        <p className="text-xs text-success-600">
                          ข้อมูลได้รับการอัปเดตเรียบร้อยแล้ว
                        </p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              )}

              <div className="flex gap-4 flex-wrap">
                <Button
                  className="w-full md:w-auto shadow-lg"
                  color="primary"
                  isDisabled={isRecalculating || isRecalculatingNew}
                  size="lg"
                  startContent={
                    isRecalculating ? (
                      <Spinner size="sm" />
                    ) : (
                      <CalculatorIcon className="size-5" />
                    )
                  }
                  variant="flat"
                  onPress={handleRecalculate}
                >
                  {isRecalculating
                    ? "กำลังคำนวณ..."
                    : "คำนวณคะแนน PHQ-A / 9Q ตามอายุ"}
                </Button>

                <Button
                  className="w-full md:w-auto shadow-lg"
                  color="primary"
                  isDisabled={isRecalculating || isRecalculatingNew}
                  size="lg"
                  startContent={
                    isRecalculatingNew ? (
                      <Spinner size="sm" />
                    ) : (
                      <ClockIcon className="size-5" />
                    )
                  }
                  variant="flat"
                  onPress={handleRecalculateNew}
                >
                  {isRecalculatingNew ? "กำลังคำนวณ..." : "คำนวณสถานะใหม่"}
                </Button>
              </div>

              {recalculateResult && (
                <Card className="mt-4 border shadow-lg">
                  <CardBody className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className={`p-2 rounded-lg ${
                          recalculateResult.success
                            ? "bg-success-100"
                            : "bg-danger-100"
                        }`}
                      >
                        {recalculateResult.success ? (
                          <CheckCircleIcon className="size-5 text-success" />
                        ) : (
                          <ExclamationTriangleIcon className="size-5 text-danger" />
                        )}
                      </div>
                      <div>
                        <span
                          className={`font-semibold text-lg ${
                            recalculateResult.success
                              ? "text-success"
                              : "text-danger"
                          }`}
                        >
                          {recalculateResult.success
                            ? "สำเร็จ"
                            : "เกิดข้อผิดพลาด"}
                        </span>
                        <p className="text-sm text-gray-600 mt-1">
                          {recalculateResult.success
                            ? "การดำเนินการเสร็จสิ้นเรียบร้อย"
                            : "พบข้อผิดพลาดในการดำเนินการ"}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm mb-4">{recalculateResult.message}</p>

                    {recalculateResult.summary && (
                      <div className="grid grid-cols-3 gap-4 text-center mb-4">
                        <Card className="bg-gray-50 border border-gray-200 shadow-lg">
                          <CardBody className="py-4 px-3">
                            <div className="text-lg font-semibold">
                              {recalculateResult.summary.total}
                            </div>
                            <div className="text-xs text-gray-500">ทั้งหมด</div>
                          </CardBody>
                        </Card>
                        <Card className="bg-success-50 border border-success-200 shadow-lg">
                          <CardBody className="py-4 px-3">
                            <div className="text-lg font-semibold text-success">
                              {recalculateResult.summary.success}
                            </div>
                            <div className="text-xs text-success-600">
                              สำเร็จ
                            </div>
                          </CardBody>
                        </Card>
                        <Card className="bg-danger-50 border border-danger-200 shadow-lg">
                          <CardBody className="py-4 px-3">
                            <div className="text-lg font-semibold text-danger">
                              {recalculateResult.summary.error}
                            </div>
                            <div className="text-xs text-danger-600">
                              ผิดพลาด
                            </div>
                          </CardBody>
                        </Card>
                      </div>
                    )}

                    {recalculateResult.mismatchSummary && (
                      <div className="mb-4 grid grid-cols-3 gap-3 text-center">
                        <Card className="bg-warning-50 border border-warning-200">
                          <CardBody className="py-3 px-2">
                            <div className="text-lg font-semibold text-warning-700">
                              {recalculateResult.mismatchSummary.wrongScale}
                            </div>
                            <div className="text-xs text-warning-700">
                              ชุดแบบไม่ตรงอายุ
                            </div>
                          </CardBody>
                        </Card>
                        <Card className="bg-warning-50 border border-warning-200">
                          <CardBody className="py-3 px-2">
                            <div className="text-lg font-semibold text-warning-700">
                              {recalculateResult.mismatchSummary.missingAddon}
                            </div>
                            <div className="text-xs text-warning-700">
                              ขาด Addon
                            </div>
                          </CardBody>
                        </Card>
                        <Card className="bg-default-100 border border-default-200">
                          <CardBody className="py-3 px-2">
                            <div className="text-lg font-semibold">
                              {recalculateResult.mismatchSummary.missingAge}
                            </div>
                            <div className="text-xs text-default-600">
                              ไม่มีวันเกิด
                            </div>
                          </CardBody>
                        </Card>
                      </div>
                    )}

                    {recalculateResult.mismatches &&
                      recalculateResult.mismatches.length > 0 && (
                        <div className="mt-4">
                          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-warning-700 flex items-center gap-2">
                              <ExclamationTriangleIcon className="size-4" />
                              รายการโครงสร้างข้อมูลไม่ตรงอายุ (
                              {recalculateResult.mismatches.length} รายการ)
                            </p>
                            <Button
                              size="sm"
                              variant="flat"
                              onPress={() =>
                                exportMismatchesCsv(
                                  recalculateResult.mismatches ?? []
                                )
                              }
                            >
                              ดาวน์โหลด CSV
                            </Button>
                          </div>
                          <div className="max-h-48 overflow-y-auto rounded-lg border border-warning-200 bg-warning-50/50 p-3">
                            {recalculateResult.mismatches
                              .slice(0, 50)
                              .map((m) => (
                                <p
                                  key={m.questionId}
                                  className="mb-1 text-xs text-default-700"
                                >
                                  {`• ${m.questionId} | อายุ ${m.age ?? "—"} | ${MISMATCH_LABELS[m.issue]} | ${m.previousResult} → ${m.newResult}`}
                                </p>
                              ))}
                            {recalculateResult.mismatches.length > 50 && (
                              <p className="text-xs text-default-500">
                                แสดง 50 รายการแรก — ดาวน์โหลด CSV เพื่อดูทั้งหมด
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                    {recalculateResult.errors &&
                      recalculateResult.errors.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-semibold text-danger mb-3 flex items-center gap-2">
                            <ExclamationTriangleIcon className="size-4 text-danger" />
                            รายละเอียดข้อผิดพลาด:
                          </p>
                          <div className="max-h-32 overflow-y-auto bg-red-50 border border-red-200 rounded-lg p-3 shadow-md">
                            {recalculateResult.errors.map((error, index) => (
                              <p
                                key={index}
                                className="text-xs text-danger mb-1"
                              >
                                • {error}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                  </CardBody>
                </Card>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </AuthGuard>
  );
}
