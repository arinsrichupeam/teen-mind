"use client";

import { Button } from "@heroui/button";
import { Checkbox } from "@heroui/checkbox";
import { Card, CardBody } from "@heroui/card";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";

import { title, subtitle } from "@/components/primitives";
import Loading from "@/app/loading";
import { teenMindProblems } from "@/app/data";

type ProblemAnswerKey =
  | "familyRelation"
  | "familyStudyPressure"
  | "familyConflict"
  | "familyAbuse"
  | "familyLoss"
  | "socialFriendIssue"
  | "socialBullying"
  | "socialBreakup"
  | "socialTeacher"
  | "socialAssault"
  | "studyStress"
  | "studyNoMotivation"
  | "studyBurnout"
  | "studyTimeManage"
  | "studyHomeworkLoad"
  | "studyExamAnxiety"
  | "financeFamilyIssue"
  | "lifestyleSocialMediaOveruse"
  | "lifestyleGamingAddiction"
  | "lifestyleSubstanceUse"
  | "lifestyleEatingIssue"
  | "lifestyleBodyImageConcern"
  | "lifestyleInsomnia";

type ProblemPayload = Record<ProblemAnswerKey, number> & {
  sum: number;
};

const allProblemKeys: ProblemAnswerKey[] = teenMindProblems.flatMap((section) =>
  section.items.map((item) => item.key as ProblemAnswerKey)
);

function createInitialProblemPayload(): ProblemPayload {
  const defaults = Object.fromEntries(
    allProblemKeys.map((key) => [key, 0])
  ) as Record<ProblemAnswerKey, number>;

  return {
    ...defaults,
    sum: 0,
  };
}

export default function QuestionProblemPage() {
  const router = useRouter();
  const [payload, setPayload] = useState<ProblemPayload>(
    createInitialProblemPayload
  );
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isErrorOpen, setIsErrorOpen] = useState(false);
  const [questionDraft, setQuestionDraft] = useState<Record<
    string,
    unknown
  > | null>(null);

  const selectedCount = useMemo(
    () =>
      allProblemKeys.reduce((acc, key) => acc + Number(payload[key] === 1), 0),
    [payload]
  );

  const toggleProblem = (key: ProblemAnswerKey) => {
    setPayload((prev) => {
      const nextValue = prev[key] === 1 ? 0 : 1;
      const nextPayload = {
        ...prev,
        [key]: nextValue,
      };
      const nextSum = allProblemKeys.reduce(
        (acc, itemKey) => acc + Number(nextPayload[itemKey] === 1),
        0
      );

      return {
        ...nextPayload,
        sum: nextSum,
      };
    });
  };

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("teenmind-question-draft");

      if (!raw) {
        setErrorMessage("ไม่พบข้อมูลแบบประเมิน กรุณาทำแบบประเมินอีกครั้ง");
        setIsErrorOpen(true);

        return;
      }
      setQuestionDraft(JSON.parse(raw) as Record<string, unknown>);
    } catch {
      setErrorMessage("ไม่สามารถอ่านข้อมูลแบบประเมินได้ กรุณาลองใหม่อีกครั้ง");
      setIsErrorOpen(true);
    }
  }, []);

  const saveProblems = async () => {
    if (!questionDraft) {
      setErrorMessage("ไม่พบข้อมูลแบบประเมิน กรุณาทำแบบประเมินอีกครั้ง");
      setIsErrorOpen(true);

      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...questionDraft,
          problem: payload,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "ไม่สามารถบันทึกข้อมูลได้");
      }

      sessionStorage.removeItem("teenmind-question-draft");
      router.push("/liff");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "เกิดข้อผิดพลาดในการบันทึกข้อมูล"
      );
      setIsErrorOpen(true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="flex flex-col w-[calc(100vw)] items-center justify-center gap-4 pt-10 px-6 py-8 md:py-10">
      <Suspense fallback={<Loading />}>
        <Modal
          backdrop="blur"
          isOpen={isErrorOpen}
          placement="center"
          size="xs"
          onOpenChange={() => setIsErrorOpen(false)}
        >
          <ModalContent>
            {() => (
              <>
                <ModalHeader className="flex flex-col items-center font-semibold text-2xl">
                  แจ้งเตือน
                </ModalHeader>
                <ModalBody className="items-center text-center">
                  <span className="flex flex-col box-border rounded-lg bg-danger-100 text-danger-500 p-3 text-center w-full text-md font-semibold">
                    {errorMessage}
                  </span>
                </ModalBody>
                <ModalFooter className="flex flex-col justify-center">
                  <Button
                    className="w-full"
                    color="primary"
                    radius="full"
                    variant="solid"
                    onPress={() => setIsErrorOpen(false)}
                  >
                    ตกลง
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        <h1 className={title({ size: "xs" })}>ปัญหาที่กำลังเผชิญ</h1>
        <h2 className={subtitle()}>
          เลือกหัวข้อที่ตรงกับสิ่งที่คุณกำลังพบเจออยู่ตอนนี้ (เลือกได้มากกว่า 1
          ข้อ)
        </h2>

        <div className="w-full text-sm text-default-500">
          เลือกแล้ว {selectedCount} หัวข้อ
        </div>

        <div className="w-full flex flex-col gap-4">
          {teenMindProblems.map((section) => (
            <Card key={section.category} shadow="sm">
              <CardBody className="gap-3">
                <h3 className="font-semibold text-primary-500">
                  {section.category}
                </h3>
                {section.items.map((item) => {
                  const key = item.key as ProblemAnswerKey;

                  return (
                    <Checkbox
                      key={item.key}
                      isSelected={payload[key] === 1}
                      onValueChange={() => toggleProblem(key)}
                    >
                      {item.label}
                    </Checkbox>
                  );
                })}
              </CardBody>
            </Card>
          ))}
        </div>

        <Button
          className="w-full"
          color="default"
          radius="full"
          size="lg"
          variant="bordered"
          onPress={() => router.push("/liff/question/phqa")}
        >
          ย้อนกลับ
        </Button>

        <Button
          className="w-full"
          color="primary"
          isDisabled={!questionDraft}
          isLoading={isSaving}
          radius="full"
          size="lg"
          variant="solid"
          onPress={saveProblems}
        >
          บันทึกผล
        </Button>
      </Suspense>
    </section>
  );
}
