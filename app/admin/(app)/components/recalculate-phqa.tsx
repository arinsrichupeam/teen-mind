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

import Loading from "@/app/loading";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface RecalculateStats {
  totalQuestions: number;
  resultStats: {
    result: string;
    count: number;
  }[];
  statusStats: {
    status: number;
    count: number;
  }[];
  hnStats: {
    empty: number;
    filled: number;
  };
}

interface RecalculateResponse {
  success: boolean;
  message: string;
  summary: {
    total: number;
    success: number;
    error: number;
  };
  errors?: string[];
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
        return "รอจัดนัด Telemed";
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
        return { bg: "bg-default-100", text: "text-default-700" };
      case 1:
        return { bg: "bg-warning-100", text: "text-warning-700" };
      case 2:
        return { bg: "bg-blue-100", text: "text-blue-700" };
      case 3:
        return { bg: "bg-success-100", text: "text-success-700" };
      default:
        return { bg: "bg-default-100", text: "text-default-700" };
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
    <div className="max-w-[95rem] my-10 px-4 lg:px-6 mx-auto w-full flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">คำนวณคะแนน PHQA ใหม่</h3>
      </div>

      {/* สถิติปัจจุบัน */}
      <Card className="w-full">
        <CardHeader className="flex gap-3">
          <InformationCircleIcon className="size-6 text-primary" />
          <div className="flex flex-col">
            <p className="text-md">สถิติปัจจุบัน</p>
            <p className="text-small text-default-500">
              จำนวนแบบสอบถามทั้งหมดที่มีข้อมูล PHQA
            </p>
          </div>
        </CardHeader>
        <CardBody>
          {stats?.success && stats.data ? (
            <div className="space-y-6">
              {/* สถิติรวม */}
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">
                  รวม {stats.data.totalQuestions} รายการ
                </span>
              </div>

              {/* สถิติสถานะ Re-calculate */}
              <div>
                <h4 className="text-md font-semibold mb-3 flex items-center gap-2">
                  <ClockIcon className="size-5 text-warning" />
                  สถานะการดำเนินการ
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                  {stats.data.statusStats
                    .sort((a, b) => a.status - b.status)
                    .map((stat) => {
                      const { bg, text } = getStatusColor(stat.status);

                      return (
                        <div
                          key={stat.status}
                          className={`flex flex-col items-center justify-center p-3 border rounded-lg gap-2 ${bg}`}
                        >
                          <span
                            className={`text-xs font-medium text-center ${text}`}
                          >
                            {getStatusText(stat.status)}
                          </span>
                          <span className="text-lg font-semibold">
                            {stat.count}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* สถิติผลลัพธ์ */}
              <div>
                <h4 className="text-md font-semibold mb-3">
                  ผลลัพธ์การประเมิน
                </h4>
                <div className="flex gap-4 w-full">
                  {sortResultStats(stats.data.resultStats).map((stat) => {
                    let bgColor = "bg-default-100";

                    switch (stat.result) {
                      case "Green":
                        bgColor = "bg-green-100";
                        break;
                      case "Green-Low":
                        bgColor = "bg-emerald-100";
                        break;
                      case "Yellow":
                        bgColor = "bg-yellow-100";
                        break;
                      case "Orange":
                        bgColor = "bg-orange-100";
                        break;
                      case "Red":
                        bgColor = "bg-red-100";
                        break;
                    }

                    return (
                      <div
                        key={stat.result}
                        className={`flex-1 flex items-center justify-between p-3 border rounded-lg gap-5 ${bgColor}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-default-600 whitespace-nowrap">
                            {getResultText(stat.result)}
                          </span>
                        </div>
                        <span className="text-lg font-semibold">
                          {stat.count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-default-500">
              ไม่สามารถโหลดข้อมูลสถิติได้
            </div>
          )}
        </CardBody>
      </Card>

      {/* ปุ่ม Recalculate */}
      <Card className="w-full">
        <CardHeader className="flex gap-3">
          <CalculatorIcon className="size-6 text-warning" />
          <div className="flex flex-col">
            <p className="text-md">คำนวณคะแนนใหม่</p>
            <p className="text-small text-default-500">
              คำนวณคะแนน PHQA และผลลัพธ์ใหม่ทั้งหมด
            </p>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {/* Progress Bar */}
            {(isRecalculating || isRecalculatingNew) && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>กำลังประมวลผล...</span>
                  <span>{progress}%</span>
                </div>
                <Progress className="w-full" color="warning" value={progress} />
              </div>
            )}

            {/* Success Notification */}
            {showSuccessNotification && (
              <div className="bg-success-50 border border-success-200 rounded-lg p-4 flex items-center gap-3">
                <CheckCircleIcon className="size-5 text-success" />
                <div>
                  <p className="text-sm font-medium text-success-800">
                    ดำเนินการเสร็จสิ้น!
                  </p>
                  <p className="text-xs text-success-600">
                    ข้อมูลได้รับการอัปเดตเรียบร้อยแล้ว
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-4 flex-wrap">
              <Button
                className="w-full md:w-auto"
                color="warning"
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
                {isRecalculating ? "กำลังคำนวณ..." : "คำนวณคะแนนใหม่"}
              </Button>

              <Button
                className="w-full md:w-auto"
                color="secondary"
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
                {isRecalculatingNew ? "กำลังอัปเดต..." : "อัปเดตสถานะ"}
              </Button>
            </div>

            {recalculateResult && (
              <div className="mt-4 p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  {recalculateResult.success ? (
                    <CheckCircleIcon className="size-5 text-success" />
                  ) : (
                    <ExclamationTriangleIcon className="size-5 text-danger" />
                  )}
                  <span
                    className={`font-semibold ${
                      recalculateResult.success ? "text-success" : "text-danger"
                    }`}
                  >
                    {recalculateResult.success ? "สำเร็จ" : "เกิดข้อผิดพลาด"}
                  </span>
                </div>

                <p className="text-sm mb-3">{recalculateResult.message}</p>

                {recalculateResult.summary && (
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold">
                        {recalculateResult.summary.total}
                      </div>
                      <div className="text-xs text-default-500">ทั้งหมด</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-success">
                        {recalculateResult.summary.success}
                      </div>
                      <div className="text-xs text-default-500">สำเร็จ</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-danger">
                        {recalculateResult.summary.error}
                      </div>
                      <div className="text-xs text-default-500">ผิดพลาด</div>
                    </div>
                  </div>
                )}

                {recalculateResult.errors &&
                  recalculateResult.errors.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-semibold text-danger mb-2">
                        รายละเอียดข้อผิดพลาด:
                      </p>
                      <div className="max-h-32 overflow-y-auto">
                        {recalculateResult.errors.map((error, index) => (
                          <p key={index} className="text-xs text-danger mb-1">
                            • {error}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
