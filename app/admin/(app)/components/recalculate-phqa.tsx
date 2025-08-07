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
    <div className="max-w-[95rem] px-4 lg:px-6 mx-auto w-full flex flex-col gap-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen py-8">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-xl font-semibold">คำนวณคะแนน PHQA ใหม่</h3>
            <p className="text-sm text-gray-600">
              จัดการและคำนวณข้อมูล PHQA ใหม่
            </p>
          </div>
        </div>
      </div>

      {/* สถิติปัจจุบัน */}
      <Card className="w-full shadow-lg">
        <CardHeader className="flex gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
          <div className="flex flex-col">
            <p className="text-md font-semibold text-blue-800">สถิติปัจจุบัน</p>
            <p className="text-small text-blue-600">
              จำนวนแบบสอบถามทั้งหมดที่มีข้อมูล PHQA
            </p>
          </div>
        </CardHeader>
        <CardBody className="p-6">
          {stats?.success && stats.data ? (
            <div className="space-y-6">
              {/* สถิติรวม */}
              <div className="flex items-center gap-2">
                <Card className="bg-gray-100 shadow-md">
                  <CardBody className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <InformationCircleIcon className="size-6 text-gray-700" />
                      <div>
                        <span className="text-lg font-semibold">
                          รวม {stats.data.totalQuestions} รายการ
                        </span>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>

              {/* สถิติสถานะ Re-calculate */}
              <div>
                <h4 className="text-md font-semibold mb-4 flex items-center gap-3">
                  <span className="font-semibold">สถานะการดำเนินการ</span>
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                  {stats.data.statusStats
                    .sort((a, b) => a.status - b.status)
                    .map((stat) => {
                      const { bg, text, border } = getStatusColor(stat.status);

                      return (
                        <Card
                          key={stat.status}
                          className={`${bg} ${border} shadow-lg`}
                        >
                          <CardBody className="py-5 px-4">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <span
                                className={`text-xs font-medium text-center ${text}`}
                              >
                                {getStatusText(stat.status)}
                              </span>
                              <span className="text-xl font-semibold">
                                {stat.count}
                              </span>
                            </div>
                          </CardBody>
                        </Card>
                      );
                    })}
                </div>
              </div>

              {/* สถิติผลลัพธ์ */}
              <div>
                <h4 className="text-md font-semibold mb-4 flex items-center gap-3">
                  <span className="font-semibold">ผลลัพธ์การประเมิน</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 w-full">
                  {sortResultStats(stats.data.resultStats).map((stat) => {
                    let bgColor = "bg-gray-100";
                    let textColor = "text-gray-700";
                    let borderColor = "border-gray-200";

                    switch (stat.result) {
                      case "Green":
                        bgColor = "bg-green-200";
                        textColor = "text-green-700";
                        borderColor = "border-green-300";
                        break;
                      case "Green-Low":
                        bgColor = "bg-green-300";
                        textColor = "text-green-600";
                        borderColor = "border-green-400";
                        break;
                      case "Yellow":
                        bgColor = "bg-warning-200";
                        textColor = "text-warning-700";
                        borderColor = "border-warning-300";
                        break;
                      case "Orange":
                        bgColor = "bg-orange-200";
                        textColor = "text-orange-700";
                        borderColor = "border-orange-300";
                        break;
                      case "Red":
                        bgColor = "bg-red-200";
                        textColor = "text-danger-700";
                        borderColor = "border-red-300";
                        break;
                    }

                    return (
                      <Card
                        key={stat.result}
                        className={`${bgColor} ${borderColor} shadow-lg`}
                      >
                        <CardBody className="py-5 px-4">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <span
                              className={`text-xs font-medium text-center ${textColor}`}
                            >
                              {getResultText(stat.result)}
                            </span>
                            <span className="text-xl font-semibold">
                              {stat.count}
                            </span>
                          </div>
                        </CardBody>
                      </Card>
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
      <Card className="w-full shadow-lg">
        <CardHeader className="flex gap-3 bg-gradient-to-r from-warning-50 to-orange-50 p-6">
          <div className="flex flex-col">
            <p className="text-md font-semibold text-warning-800">
              คำนวณคะแนนและสถานะใหม่
            </p>
            <p className="text-small text-warning-600">
              แยกการคำนวณคะแนน PHQA และการคำนวณสถานะ
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
                {isRecalculating ? "กำลังคำนวณ..." : "คำนวณคะแนน PHQA ใหม่"}
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
                          <div className="text-xs text-success-600">สำเร็จ</div>
                        </CardBody>
                      </Card>
                      <Card className="bg-danger-50 border border-danger-200 shadow-lg">
                        <CardBody className="py-4 px-3">
                          <div className="text-lg font-semibold text-danger">
                            {recalculateResult.summary.error}
                          </div>
                          <div className="text-xs text-danger-600">ผิดพลาด</div>
                        </CardBody>
                      </Card>
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
                            <p key={index} className="text-xs text-danger mb-1">
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
  );
}
