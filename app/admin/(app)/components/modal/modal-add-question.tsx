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
  Checkbox,
} from "@heroui/react";
import { useState, useCallback, useMemo } from "react";

import {
  q2,
  qPhqa,
  phqaAddon,
  q9,
  q8 as q8Questions,
  q8Addon as q8AddonQuestions,
  teenMindProblems,
} from "@/app/data";
import {
  calculateAge,
  getPhqaRiskLevel,
  getPhqaRiskText,
  getNineQRiskLevel,
  getNineQRiskText,
} from "@/utils/helper";

const Q8_YES_WEIGHTS = [1, 2, 6, 8, 9, 5, 10, 4] as const;

type StepType = "referent" | "q2" | "phqa" | "addon" | "q9" | "q8" | "problem";

type AgeGroup = "under12" | "over12";

const PROBLEM_KEYS = teenMindProblems.flatMap((section) =>
  section.items.map((item) => item.key)
);

function createEmptyFormData() {
  const problemFields = Object.fromEntries(
    PROBLEM_KEYS.map((key) => [key, "0"])
  );

  return {
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
    q9_q1: "",
    q9_q2: "",
    q9_q3: "",
    q9_q4: "",
    q9_q5: "",
    q9_q6: "",
    q9_q7: "",
    q9_q8: "",
    q9_q9: "",
    q8_q1: "",
    q8_q2: "",
    q8_q3: "",
    q8_q4: "",
    q8_q5: "",
    q8_q6: "",
    q8_q7: "",
    q8_q8: "",
    q8_addon: "0",
    ...problemFields,
  };
}

function getStepSequence(ageGroup: AgeGroup): StepType[] {
  if (ageGroup === "under12") {
    return ["referent", "q2", "phqa", "addon", "q8", "problem"];
  }

  return ["referent", "q2", "q9", "q8", "problem"];
}

function getStepLabel(stepType: StepType): string {
  switch (stepType) {
    case "referent":
      return "Referent";
    case "q2":
      return "2Q";
    case "phqa":
      return "PHQA";
    case "addon":
      return "Addon";
    case "q9":
      return "9Q";
    case "q8":
      return "8Q";
    case "problem":
      return "ปัญหา";
  }
}

interface ModalAddQuestionProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  birthday?: string | null;
  onSuccess?: () => void;
}

export const ModalAddQuestion = ({
  isOpen,
  onClose,
  userId,
  birthday,
  onSuccess,
}: ModalAddQuestionProps) => {
  const ageGroup = useMemo<AgeGroup>(() => {
    if (!birthday) return "under12";
    const age = calculateAge(String(birthday));

    // อายุต่ำกว่า 18 ปี → PHQ-A + Addon, อายุ 18 ปีขึ้นไป → 9Q
    return age < 18 ? "under12" : "over12";
  }, [birthday]);

  const stepSequence = useMemo(() => getStepSequence(ageGroup), [ageGroup]);
  const totalSteps = stepSequence.length;

  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [referentData, setReferentData] = useState<{
    fullName: string;
    affiliation: string;
    agency: string;
  }>();
  const [formData, setFormData] = useState(createEmptyFormData);

  const getStepType = useCallback(
    (step: number): StepType | undefined => stepSequence[step - 1],
    [stepSequence]
  );

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

  const isQ8StepComplete = () => {
    for (let i = 1; i <= 8; i++) {
      if (formData[`q8_q${i}` as keyof typeof formData] === "") {
        return false;
      }
    }

    if (formData.q8_q3 === "6") {
      return formData.q8_addon === "0" || formData.q8_addon === "8";
    }

    return true;
  };

  const isFormComplete = () => {
    if (
      formData.referentId === "" ||
      formData.q2_q1 === "" ||
      formData.q2_q2 === ""
    ) {
      return false;
    }

    if (ageGroup === "under12") {
      for (let i = 1; i <= 9; i++) {
        if (formData[`phqa_q${i}` as keyof typeof formData] === "") {
          return false;
        }
      }
      if (formData.addon_q1 === "" || formData.addon_q2 === "") {
        return false;
      }
    } else {
      for (let i = 1; i <= 9; i++) {
        if (formData[`q9_q${i}` as keyof typeof formData] === "") {
          return false;
        }
      }
    }

    return isQ8StepComplete();
  };

  const isStepComplete = (step: number) => {
    const stepType = getStepType(step);

    switch (stepType) {
      case "referent":
        return (
          formData.referentId !== "" && referentData?.fullName !== "ไม่พบข้อมูล"
        );
      case "q2":
        return formData.q2_q1 !== "" && formData.q2_q2 !== "";
      case "phqa":
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
      case "addon":
        return formData.addon_q1 !== "" && formData.addon_q2 !== "";
      case "q9":
        return (
          formData.q9_q1 !== "" &&
          formData.q9_q2 !== "" &&
          formData.q9_q3 !== "" &&
          formData.q9_q4 !== "" &&
          formData.q9_q5 !== "" &&
          formData.q9_q6 !== "" &&
          formData.q9_q7 !== "" &&
          formData.q9_q8 !== "" &&
          formData.q9_q9 !== ""
        );
      case "q8":
        return isQ8StepComplete();
      case "problem":
        return true;
      default:
        return false;
    }
  };

  const buildQ8Payload = () => {
    const q8AddonValue =
      formData.q8_q3 === "6" ? parseInt(formData.q8_addon) : 0;
    const q8Values = {
      q1: parseInt(formData.q8_q1),
      q2: parseInt(formData.q8_q2),
      q3: parseInt(formData.q8_q3),
      q4: parseInt(formData.q8_q4),
      q5: parseInt(formData.q8_q5),
      q6: parseInt(formData.q8_q6),
      q7: parseInt(formData.q8_q7),
      q8: parseInt(formData.q8_q8),
      q8Addon: q8AddonValue,
    };
    const q8_sum = Object.values(q8Values).reduce((sum, val) => sum + val, 0);

    return { ...q8Values, sum: q8_sum };
  };

  const buildProblemPayload = () => {
    const problem = Object.fromEntries(
      PROBLEM_KEYS.map((key) => [
        key,
        parseInt(formData[key as keyof typeof formData] as string),
      ])
    ) as Record<string, number>;
    const sum = PROBLEM_KEYS.reduce(
      (acc, key) => acc + Number(problem[key] === 1),
      0
    );

    return { ...problem, sum };
  };

  const handleSubmit = async () => {
    if (ageGroup === "under12") {
      for (let i = 1; i <= 9; i++) {
        const value = parseInt(
          formData[`phqa_q${i}` as keyof typeof formData] as string
        );

        if (value < 0 || value > 3) {
          alert(`ค่า PHQA ข้อที่ ${i} ไม่ถูกต้อง (ต้องอยู่ระหว่าง 0-3)`);

          return;
        }
      }

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
    } else {
      for (let i = 1; i <= 9; i++) {
        const value = parseInt(
          formData[`q9_q${i}` as keyof typeof formData] as string
        );

        if (value < 0 || value > 3) {
          alert(`ค่า 9Q ข้อที่ ${i} ไม่ถูกต้อง (ต้องอยู่ระหว่าง 0-3)`);

          return;
        }
      }
    }

    if (parseInt(formData.q2_q1) !== 0 && parseInt(formData.q2_q1) !== 1) {
      alert("ค่า 2Q ข้อที่ 1 ไม่ถูกต้อง (ต้องเป็น 0 หรือ 1)");

      return;
    }
    if (parseInt(formData.q2_q2) !== 0 && parseInt(formData.q2_q2) !== 1) {
      alert("ค่า 2Q ข้อที่ 2 ไม่ถูกต้อง (ต้องเป็น 0 หรือ 1)");

      return;
    }

    setIsLoading(true);
    try {
      const q8Payload = buildQ8Payload();
      const problemPayload = buildProblemPayload();

      let scoreSum: number;
      let result: string;
      let result_text: string;

      const basePayload: Record<string, unknown> = {
        profileId: userId,
        reference: parseInt(formData.referentId),
        Q2: {
          q1: parseInt(formData.q2_q1),
          q2: parseInt(formData.q2_q2),
        },
        q8: q8Payload,
        problem: problemPayload,
        location: {
          latitude: 0,
          longitude: 0,
        },
      };

      if (ageGroup === "under12") {
        scoreSum = [
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

        result = getPhqaRiskLevel(scoreSum);
        result_text = getPhqaRiskText(scoreSum);

        basePayload.result = result;
        basePayload.result_text = result_text;
        basePayload.phqa = {
          q1: parseInt(formData.phqa_q1),
          q2: parseInt(formData.phqa_q2),
          q3: parseInt(formData.phqa_q3),
          q4: parseInt(formData.phqa_q4),
          q5: parseInt(formData.phqa_q5),
          q6: parseInt(formData.phqa_q6),
          q7: parseInt(formData.phqa_q7),
          q8: parseInt(formData.phqa_q8),
          q9: parseInt(formData.phqa_q9),
          sum: scoreSum,
        };
        basePayload.phqaAddon = {
          q1: parseInt(formData.addon_q1),
          q2: parseInt(formData.addon_q2),
        };
      } else {
        scoreSum = [
          parseInt(formData.q9_q1),
          parseInt(formData.q9_q2),
          parseInt(formData.q9_q3),
          parseInt(formData.q9_q4),
          parseInt(formData.q9_q5),
          parseInt(formData.q9_q6),
          parseInt(formData.q9_q7),
          parseInt(formData.q9_q8),
          parseInt(formData.q9_q9),
        ].reduce((sum, val) => sum + val, 0);

        result = getNineQRiskLevel(scoreSum);
        result_text = getNineQRiskText(scoreSum);

        basePayload.result = result;
        basePayload.result_text = result_text;
        basePayload.q9 = {
          q1: parseInt(formData.q9_q1),
          q2: parseInt(formData.q9_q2),
          q3: parseInt(formData.q9_q3),
          q4: parseInt(formData.q9_q4),
          q5: parseInt(formData.q9_q5),
          q6: parseInt(formData.q9_q6),
          q7: parseInt(formData.q9_q7),
          q8: parseInt(formData.q9_q8),
          q9: parseInt(formData.q9_q9),
          sum: scoreSum,
        };
      }

      const response = await fetch(`/api/question`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(basePayload),
      });

      if (response.ok) {
        setFormData(createEmptyFormData());
        setReferentData(undefined);
        setCurrentStep(1);

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

  const resetForm = () => {
    setFormData(createEmptyFormData());
    setReferentData(undefined);
    setCurrentStep(1);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderScaleQuestions = (
    title: string,
    questions: string[],
    fieldPrefix: "phqa" | "q9"
  ) => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-primary">{title}</h3>
      <div className="space-y-4">
        {questions.map((question, index) => (
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
                    `${fieldPrefix}_q${index + 1}` as keyof typeof formData
                  ] as string
                }
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    [`${fieldPrefix}_q${index + 1}`]: value,
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

  const renderQ8Step = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-primary">แบบทดสอบ 8Q</h3>
      <div className="space-y-4">
        {q8Questions.map((question, index) => {
          const questionNumber = index + 1;
          const fieldKey = `q8_q${questionNumber}` as keyof typeof formData;
          const yesWeight = Q8_YES_WEIGHTS[index] ?? 1;

          return (
            <div key={questionNumber}>
              <Card className="p-4">
                <CardBody>
                  <p className="text-sm mb-3">
                    <span className="text-red-500 font-bold">*</span>{" "}
                    <span className="font-semibold text-primary">
                      {questionNumber}.{" "}
                    </span>
                    {question}
                  </p>
                  <RadioGroup
                    value={formData[fieldKey] as string}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        [fieldKey]: value,
                        ...(questionNumber === 3 && value !== "6"
                          ? { q8_addon: "0" }
                          : {}),
                      }))
                    }
                  >
                    <Radio value="0">ไม่ใช่</Radio>
                    <Radio value={String(yesWeight)}>ใช่</Radio>
                  </RadioGroup>
                </CardBody>
              </Card>

              {questionNumber === 3 && formData.q8_q3 === "6" && (
                <Card className="p-4 mt-4 border-primary-200">
                  <CardBody>
                    <p className="text-sm mb-3">
                      <span className="text-red-500 font-bold">*</span>{" "}
                      คำถามต่อเนื่อง: {q8AddonQuestions[0]}
                    </p>
                    <RadioGroup
                      value={formData.q8_addon}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          q8_addon: value,
                        }))
                      }
                    >
                      <Radio value="0">ได้</Radio>
                      <Radio value="8">ไม่ได้</Radio>
                    </RadioGroup>
                  </CardBody>
                </Card>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderProblemStep = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-primary">แบบประเมินปัญหา</h3>
      <p className="text-sm text-default-600">
        เลือกหัวข้อที่ตรงกับสิ่งที่กำลังพบเจออยู่ (เลือกได้มากกว่า 1 ข้อ)
      </p>
      <div className="space-y-4">
        {teenMindProblems.map((section) => (
          <Card key={section.category} className="p-4">
            <CardBody>
              <p className="font-semibold text-primary mb-3">
                {section.category}
              </p>
              <div className="flex flex-col gap-2">
                {section.items.map((item) => (
                  <Checkbox
                    key={item.key}
                    isSelected={
                      formData[item.key as keyof typeof formData] === "1"
                    }
                    onValueChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        [item.key]: checked ? "1" : "0",
                      }))
                    }
                  >
                    {item.label}
                  </Checkbox>
                ))}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderStepContent = () => {
    const stepType = getStepType(currentStep);

    switch (stepType) {
      case "referent":
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
      case "q2":
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
      case "phqa":
        return renderScaleQuestions("แบบทดสอบ PHQA", qPhqa, "phqa");
      case "addon":
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
      case "q9":
        return renderScaleQuestions("แบบทดสอบ 9Q", q9, "q9");
      case "q8":
        return renderQ8Step();
      case "problem":
        return renderProblemStep();
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
              <div className="flex justify-between items-center gap-2">
                <h3>เพิ่มแบบทดสอบใหม่</h3>
                <div className="flex flex-wrap gap-2 justify-end">
                  {stepSequence.map((stepType, index) => (
                    <span
                      key={stepType}
                      className={`px-2 py-1 rounded text-xs ${currentStep >= index + 1 ? "bg-primary text-white" : "bg-default-200"}`}
                    >
                      {getStepLabel(stepType)}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-xs text-default-500">
                ชุดคำถามหลัก:{" "}
                {ageGroup === "under12"
                  ? "PHQ-A + Addon (อายุต่ำกว่า 18 ปี)"
                  : "9Q (อายุ 18 ปีขึ้นไป)"}
              </p>
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
              {currentStep < totalSteps ? (
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
