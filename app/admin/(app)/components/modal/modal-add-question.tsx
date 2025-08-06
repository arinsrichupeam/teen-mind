"use client";

import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Radio,
  RadioGroup,
  Card,
  CardBody,
  InputOtp,
  Divider,
  addToast,
} from "@heroui/react";
import { useState, useCallback } from "react";

import { q2, qPhqa, phqaAddon } from "@/app/data";
import { getPhqaRiskLevel, getPhqaRiskText } from "@/utils/helper";

interface ModalAddQuestionProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSuccess?: () => void;
}

export const ModalAddQuestion = ({
  isOpen,
  onClose,
  userId,
  onSuccess,
}: ModalAddQuestionProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [referentData, setReferentData] = useState<{
    fullName: string;
    affiliation: string;
    agency: string;
  }>();
  const [formData, setFormData] = useState({
    // Referent
    referentId: "",
    // 2Q
    q2_q1: "",
    q2_q2: "",
    // PHQA
    phqa_q1: "",
    phqa_q2: "",
    phqa_q3: "",
    phqa_q4: "",
    phqa_q5: "",
    phqa_q6: "",
    phqa_q7: "",
    phqa_q8: "",
    phqa_q9: "",
    // Addon
    addon_q1: "",
    addon_q2: "",
  });

  const fetchReferentData = useCallback(async (id: string) => {
    const referentId = parseInt(id);

    setIsLoading(true);

    try {
      const response = await fetch(`/api/data/referent/${referentId}`);
      const data = await response.json();
      const fullName = data[0].firstname + " " + data[0].lastname;
      const affiliation = data[0].affiliation.name;
      const agency = data[0].agency;

      setReferentData({
        fullName: fullName,
        affiliation: affiliation,
        agency: agency,
      });
    } catch {
      setReferentData({
        fullName: "ไม่พบข้อมูล",
        affiliation: "ไม่พบข้อมูล",
        agency: "ไม่พบข้อมูล",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleReferentChange = useCallback(
    (value: string) => {
      setFormData((prev) => ({
        ...prev,
        referentId: value,
      }));
      if (value.length === 3) {
        fetchReferentData(value);
      }
    },
    [fetchReferentData]
  );

  const isFormComplete = () => {
    const requiredFields = [
      "referentId",
      "q2_q1",
      "q2_q2",
      "phqa_q1",
      "phqa_q2",
      "phqa_q3",
      "phqa_q4",
      "phqa_q5",
      "phqa_q6",
      "phqa_q7",
      "phqa_q8",
      "phqa_q9",
      "addon_q1",
      "addon_q2",
    ];

    return requiredFields.every(
      (field) => formData[field as keyof typeof formData] !== ""
    );
  };

  const isStepComplete = (step: number) => {
    switch (step) {
      case 1:
        return (
          formData.referentId !== "" && referentData?.fullName !== "ไม่พบข้อมูล"
        );
      case 2:
        return formData.q2_q1 !== "" && formData.q2_q2 !== "";
      case 3:
        return (
          formData.phqa_q1 !== "" &&
          formData.phqa_q2 !== "" &&
          formData.phqa_q3 !== "" &&
          formData.phqa_q4 !== "" &&
          formData.phqa_q5 !== "" &&
          formData.phqa_q6 !== "" &&
          formData.phqa_q7 !== "" &&
          formData.phqa_q8 !== "" &&
          formData.phqa_q9 !== ""
        );
      case 4:
        return formData.addon_q1 !== "" && formData.addon_q2 !== "";
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    // ตรวจสอบค่า PHQA ต้องอยู่ระหว่าง 0-3
    for (let i = 1; i <= 9; i++) {
      const value = parseInt(
        formData[`phqa_q${i}` as keyof typeof formData] as string
      );

      if (value < 0 || value > 3) {
        alert(`ค่า PHQA ข้อที่ ${i} ไม่ถูกต้อง (ต้องอยู่ระหว่าง 0-3)`);

        return;
      }
    }

    // ตรวจสอบค่า 2Q ต้องเป็น 0 หรือ 1
    if (parseInt(formData.q2_q1) !== 0 && parseInt(formData.q2_q1) !== 1) {
      alert("ค่า 2Q ข้อที่ 1 ไม่ถูกต้อง (ต้องเป็น 0 หรือ 1)");

      return;
    }
    if (parseInt(formData.q2_q2) !== 0 && parseInt(formData.q2_q2) !== 1) {
      alert("ค่า 2Q ข้อที่ 2 ไม่ถูกต้อง (ต้องเป็น 0 หรือ 1)");

      return;
    }

    // ตรวจสอบค่า Addon ต้องเป็น 0 หรือ 1
    if (
      parseInt(formData.addon_q1) !== 0 &&
      parseInt(formData.addon_q1) !== 1
    ) {
      alert("ค่า Addon ข้อที่ 1 ไม่ถูกต้อง (ต้องเป็น 0 หรือ 1)");

      return;
    }
    if (
      parseInt(formData.addon_q2) !== 0 &&
      parseInt(formData.addon_q2) !== 1
    ) {
      alert("ค่า Addon ข้อที่ 2 ไม่ถูกต้อง (ต้องเป็น 0 หรือ 1)");

      return;
    }

    setIsLoading(true);
    try {
      // คำนวณผลรวม PHQA
      const phqaSum = [
        parseInt(formData.phqa_q1),
        parseInt(formData.phqa_q2),
        parseInt(formData.phqa_q3),
        parseInt(formData.phqa_q4),
        parseInt(formData.phqa_q5),
        parseInt(formData.phqa_q6),
        parseInt(formData.phqa_q7),
        parseInt(formData.phqa_q8),
        parseInt(formData.phqa_q9),
      ].reduce((sum, val) => sum + val, 0);

      // คำนวณผลลัพธ์
      const result = getPhqaRiskLevel(phqaSum);
      const result_text = getPhqaRiskText(phqaSum);

      const response = await fetch(`/api/question`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profileId: userId,
          reference: parseInt(formData.referentId),
          result: result,
          result_text: result_text,
          phqa: {
            q1: parseInt(formData.phqa_q1),
            q2: parseInt(formData.phqa_q2),
            q3: parseInt(formData.phqa_q3),
            q4: parseInt(formData.phqa_q4),
            q5: parseInt(formData.phqa_q5),
            q6: parseInt(formData.phqa_q6),
            q7: parseInt(formData.phqa_q7),
            q8: parseInt(formData.phqa_q8),
            q9: parseInt(formData.phqa_q9),
            sum: phqaSum,
          },
          Q2: {
            q1: parseInt(formData.q2_q1),
            q2: parseInt(formData.q2_q2),
          },
          phqaAddon: {
            q1: parseInt(formData.addon_q1),
            q2: parseInt(formData.addon_q2),
          },
          location: {
            latitude: 0,
            longitude: 0,
          },
        }),
      });

      if (response.ok) {
        // รีเซ็ตฟอร์ม
        setFormData({
          referentId: "",
          q2_q1: "",
          q2_q2: "",
          phqa_q1: "",
          phqa_q2: "",
          phqa_q3: "",
          phqa_q4: "",
          phqa_q5: "",
          phqa_q6: "",
          phqa_q7: "",
          phqa_q8: "",
          phqa_q9: "",
          addon_q1: "",
          addon_q2: "",
        });
        setReferentData(undefined);
        setCurrentStep(1);

        // เรียก callback เมื่อสำเร็จ
        if (onSuccess) {
          onSuccess();
        }

        onClose();
      } else {
        const errorData = await response.json();

        alert(
          `เกิดข้อผิดพลาด: ${errorData.error || "ไม่สามารถเพิ่มแบบทดสอบได้"}`
        );
      }
    } catch (error) {
      addToast({
        title: "ผิดพลาด",
        description:
          "ไม่สามารถดึงข้อมูลจากระบบ" +
          (error instanceof Error ? error.message : "ไม่ระบุข้อมูล"),
        color: "danger",
      });
      alert("เกิดข้อผิดพลาดในการเพิ่มแบบทดสอบ");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // รีเซ็ตฟอร์มเมื่อปิด modal
    setFormData({
      referentId: "",
      q2_q1: "",
      q2_q2: "",
      phqa_q1: "",
      phqa_q2: "",
      phqa_q3: "",
      phqa_q4: "",
      phqa_q5: "",
      phqa_q6: "",
      phqa_q7: "",
      phqa_q8: "",
      phqa_q9: "",
      addon_q1: "",
      addon_q2: "",
    });
    setReferentData(undefined);
    setCurrentStep(1);
    onClose();
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">
              ข้อมูลผู้ให้คำแนะนำ
            </h3>
            <div className="flex flex-col items-center text-center">
              <Divider />
              <div className="flex justify-center">
                <InputOtp
                  className="items-center"
                  errorMessage="กรุณากรอกรหัสผู้ให้คำแนะนำให้ถูกต้อง"
                  length={3}
                  radius="lg"
                  size="lg"
                  value={formData.referentId}
                  variant="bordered"
                  onValueChange={(val) => handleReferentChange(val)}
                />
              </div>
              <Divider />
              {formData.referentId.length === 3 &&
                (isLoading ? (
                  <div className="flex justify-center items-center p-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
                  </div>
                ) : referentData?.fullName !== "ไม่พบข้อมูล" ? (
                  <span className="flex flex-col box-border rounded-lg bg-primary-100 text-primary-500 p-3 text-left w-full text-md font-semibold">
                    ชื่อผู้ให้คำแนะนำ : {referentData?.fullName}
                    <br />
                    สังกัด : {referentData?.affiliation}
                    <br />
                    หน่วยงาน : {referentData?.agency}
                  </span>
                ) : (
                  <span className="flex flex-col box-border rounded-lg bg-danger-100 text-danger-500 p-3 text-center w-full text-md font-semibold">
                    รหัสผู้ให้คำแนะนำไม่ถูกต้อง
                  </span>
                ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">แบบทดสอบ 2Q</h3>
            <div className="space-y-4">
              {q2.map((question, index) => (
                <Card key={index} className="p-4">
                  <CardBody>
                    <p className="text-sm mb-3">
                      <span className="text-red-500 font-bold">*</span>{" "}
                      {question}
                    </p>
                    <RadioGroup
                      value={
                        formData[
                          `q2_q${index + 1}` as keyof typeof formData
                        ] as string
                      }
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          [`q2_q${index + 1}`]: value,
                        }))
                      }
                    >
                      <Radio value="0">ไม่ใช่</Radio>
                      <Radio value="1">ใช่</Radio>
                    </RadioGroup>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">
              แบบทดสอบ PHQA
            </h3>
            <div className="space-y-4">
              {qPhqa.map((question, index) => (
                <Card key={index} className="p-4">
                  <CardBody>
                    <p className="text-sm mb-3">
                      <span className="text-red-500 font-bold">*</span>{" "}
                      <span className="font-semibold text-primary">
                        {index + 1}.{" "}
                      </span>
                      {question}
                    </p>
                    <RadioGroup
                      value={
                        formData[
                          `phqa_q${index + 1}` as keyof typeof formData
                        ] as string
                      }
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          [`phqa_q${index + 1}`]: value,
                        }))
                      }
                    >
                      <Radio value="0">ไม่มีเลย</Radio>
                      <Radio value="1">มีบางวัน</Radio>
                      <Radio value="2">มีมากกว่า 7 วัน</Radio>
                      <Radio value="3">มีแทบทุกวัน</Radio>
                    </RadioGroup>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">
              แบบทดสอบ Addon
            </h3>
            <div className="space-y-4">
              {phqaAddon.map((question, index) => (
                <Card key={index} className="p-4">
                  <CardBody>
                    <p className="text-sm mb-3">
                      <span className="text-red-500 font-bold">*</span>{" "}
                      {question}
                    </p>
                    <RadioGroup
                      value={
                        formData[
                          `addon_q${index + 1}` as keyof typeof formData
                        ] as string
                      }
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          [`addon_q${index + 1}`]: value,
                        }))
                      }
                    >
                      <Radio value="0">ไม่ใช่</Radio>
                      <Radio value="1">ใช่</Radio>
                    </RadioGroup>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      backdrop="blur"
      isOpen={isOpen}
      placement="center"
      scrollBehavior="inside"
      size="4xl"
      onOpenChange={handleClose}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <h3>เพิ่มแบบทดสอบใหม่</h3>
                <div className="flex gap-2">
                  <span
                    className={`px-2 py-1 rounded text-xs ${currentStep >= 1 ? "bg-primary text-white" : "bg-default-200"}`}
                  >
                    Referent
                  </span>
                  <span
                    className={`px-2 py-1 rounded text-xs ${currentStep >= 2 ? "bg-primary text-white" : "bg-default-200"}`}
                  >
                    2Q
                  </span>
                  <span
                    className={`px-2 py-1 rounded text-xs ${currentStep >= 3 ? "bg-primary text-white" : "bg-default-200"}`}
                  >
                    PHQA
                  </span>
                  <span
                    className={`px-2 py-1 rounded text-xs ${currentStep >= 4 ? "bg-primary text-white" : "bg-default-200"}`}
                  >
                    Addon
                  </span>
                </div>
              </div>
            </ModalHeader>
            <ModalBody>{renderStepContent()}</ModalBody>
            <ModalFooter>
              <Button
                color="danger"
                isDisabled={isLoading}
                variant="flat"
                onPress={handleClose}
              >
                ยกเลิก
              </Button>
              {currentStep > 1 && (
                <Button
                  color="default"
                  isDisabled={isLoading}
                  variant="flat"
                  onPress={prevStep}
                >
                  ย้อนกลับ
                </Button>
              )}
              {currentStep < 4 ? (
                <Button
                  color="primary"
                  isDisabled={isLoading || !isStepComplete(currentStep)}
                  onPress={nextStep}
                >
                  ถัดไป
                </Button>
              ) : (
                <Button
                  color="primary"
                  isDisabled={!isFormComplete()}
                  isLoading={isLoading}
                  onPress={handleSubmit}
                >
                  บันทึก
                </Button>
              )}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
