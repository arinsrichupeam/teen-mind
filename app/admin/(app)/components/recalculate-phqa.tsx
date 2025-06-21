"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Progress,
  Chip,
  Spinner,
  addToast,
} from "@heroui/react";
import {
  CalculatorIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

interface RecalculateStats {
  totalQuestions: number;
  resultStats: Array<{
    result: string;
    count: number;
  }>;
}

interface RecalculateResult {
  success: boolean;
  message: string;
  summary: {
    total: number;
    success: number;
    error: number;
  };
  errors?: string[];
}

export const RecalculatePHQA = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [stats, setStats] = useState<RecalculateStats | null>(null);
  const [result, setResult] = useState<RecalculateResult | null>(null);
  const [progress, setProgress] = useState(0);

  // ดึงข้อมูลสถิติ
  const fetchStats = async () => {
    try {
      const response = await fetch("/api/question/recalculate");
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      addToast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "ไม่สามารถดึงข้อมูลสถิติได้",
        color: "danger",
      });
    }
  };

  // Re-calculate ทั้งหมด
  const handleRecalculate = async () => {
    setIsRecalculating(true);
    setProgress(0);
    setResult(null);

    try {
      // จำลอง progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);

            return 90;
          }

          return prev + 10;
        });
      }, 200);

      const response = await fetch("/api/question/recalculate", {
        method: "POST",
      });

      const data: RecalculateResult = await response.json();

      clearInterval(progressInterval);
      setProgress(100);

      if (data.success) {
        setResult(data);
        addToast({
          title: "สำเร็จ",
          description: data.message,
          color: "success",
        });

        // รีเฟรชข้อมูลสถิติ
        await fetchStats();
      } else {
        addToast({
          title: "ผิดพลาด",
          description: "เกิดข้อผิดพลาดในการ re-calculate",
          color: "danger",
        });
      }
    } catch (error) {
      addToast({
        title: "ผิดพลาด",
        description:
          error instanceof Error
            ? error.message
            : "เกิดข้อผิดพลาดในการเชื่อมต่อ",
        color: "danger",
      });
    } finally {
      setIsRecalculating(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const getResultColor = (result: string) => {
    switch (result) {
      case "Green":
        return "success";
      case "Green-Low":
        return "success";
      case "Yellow":
        return "warning";
      case "Orange":
        return "warning";
      case "Red":
        return "danger";
      default:
        return "default";
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

  // ฟังก์ชันสำหรับเรียงลำดับผลลัพธ์
  const sortResultStats = (stats: Array<{ result: string; count: number }>) => {
    const order = ["Green", "Green-Low", "Yellow", "Orange", "Red"];

    return stats.sort((a, b) => {
      const aIndex = order.indexOf(a.result);
      const bIndex = order.indexOf(b.result);

      return aIndex - bIndex;
    });
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader className="flex gap-3">
          <CalculatorIcon className="w-6 h-6 text-primary" />
          <div className="flex flex-col">
            <p className="text-md font-semibold">Re-calculate PHQA Results</p>
            <p className="text-small text-default-500">
              คำนวณผลลัพธ์ PHQA ใหม่ทั้งหมดในระบบ
            </p>
          </div>
        </CardHeader>
        <CardBody>
          {stats && (
            <div className="mb-4">
              <p className="text-sm text-default-600 mb-2">
                จำนวนแบบสอบถามทั้งหมด: <strong>{stats.totalQuestions}</strong>{" "}
                รายการ
              </p>
              <div className="flex flex-wrap gap-2">
                {sortResultStats(stats.resultStats).map((stat) => (
                  <Chip
                    key={stat.result}
                    color={getResultColor(stat.result)}
                    size="sm"
                    variant="flat"
                  >
                    {getResultText(stat.result)}: {stat.count}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              color="primary"
              isDisabled={isRecalculating}
              startContent={<CalculatorIcon className="w-4 h-4" />}
              variant="flat"
              onPress={() => setIsModalOpen(true)}
            >
              Re-calculate ทั้งหมด
            </Button>
          </div>
        </CardBody>
      </Card>

      <Modal
        hideCloseButton={isRecalculating}
        isDismissable={!isRecalculating}
        isOpen={isModalOpen}
        size="lg"
        onClose={() => !isRecalculating && setIsModalOpen(false)}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <ExclamationTriangleIcon className="w-5 h-5 text-warning" />
                  ยืนยันการ Re-calculate
                </div>
              </ModalHeader>
              <ModalBody>
                {!isRecalculating ? (
                  <div className="space-y-4">
                    <p>คุณต้องการคำนวณผลลัพธ์ PHQA ใหม่ทั้งหมดในระบบหรือไม่?</p>
                    <div className="bg-warning-50 p-3 rounded-lg">
                      <p className="text-warning-700 text-sm">
                        <strong>คำเตือน:</strong>{" "}
                        การดำเนินการนี้จะอัปเดตผลลัพธ์ทั้งหมดในระบบ
                        และอาจใช้เวลาสักครู่
                        กรุณารอจนกว่าการดำเนินการจะเสร็จสิ้น
                      </p>
                    </div>
                    {stats && (
                      <p className="text-sm text-default-600">
                        จะประมวลผลทั้งหมด{" "}
                        <strong>{stats.totalQuestions}</strong> รายการ
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Spinner size="sm" />
                      <span>กำลังประมวลผล...</span>
                    </div>
                    <Progress
                      className="w-full"
                      color="primary"
                      value={progress}
                    />
                    <p className="text-sm text-default-600">
                      ความคืบหน้า: {progress}%
                    </p>
                  </div>
                )}

                {result && (
                  <div className="space-y-3">
                    <div className="bg-success-50 p-3 rounded-lg">
                      <p className="text-success-700 text-sm font-medium">
                        {result.message}
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="text-center">
                        <p className="font-semibold text-primary">
                          {result.summary.total}
                        </p>
                        <p className="text-default-500">ทั้งหมด</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-success">
                          {result.summary.success}
                        </p>
                        <p className="text-default-500">สำเร็จ</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-danger">
                          {result.summary.error}
                        </p>
                        <p className="text-default-500">ผิดพลาด</p>
                      </div>
                    </div>
                    {result.errors && result.errors.length > 0 && (
                      <div className="bg-danger-50 p-3 rounded-lg">
                        <p className="text-danger-700 text-sm font-medium mb-2">
                          ข้อผิดพลาด ({result.errors.length} รายการ):
                        </p>
                        <div className="max-h-32 overflow-y-auto">
                          {result.errors.slice(0, 5).map((error, index) => (
                            <p key={index} className="text-danger-600 text-xs">
                              {error}
                            </p>
                          ))}
                          {result.errors.length > 5 && (
                            <p className="text-danger-600 text-xs">
                              และอีก {result.errors.length - 5} รายการ...
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                {!isRecalculating && !result && (
                  <>
                    <Button variant="light" onPress={onClose}>
                      ยกเลิก
                    </Button>
                    <Button color="primary" onPress={handleRecalculate}>
                      ยืนยัน
                    </Button>
                  </>
                )}
                {!isRecalculating && result && (
                  <Button color="primary" onPress={onClose}>
                    ปิด
                  </Button>
                )}
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};
