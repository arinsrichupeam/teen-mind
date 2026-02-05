"use client";

import { Button } from "@heroui/button";
import { Tab, Tabs } from "@heroui/tabs";
import { Progress } from "@heroui/progress";
import { Image } from "@heroui/image";
import { Questions_PHQA, Questions_PHQA_Addon } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { Radio, RadioGroup } from "@heroui/radio";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/modal";
import { Divider, InputOtp } from "@heroui/react";

import { subtitle, title } from "@/components/primitives";
import { LocationData } from "@/types";
import Loading from "@/app/loading";
import { q2, qPhqa, phqaAddon } from "@/app/data";

export default function PHQAPage() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref") || "";
  const profileId = searchParams.get("profileId") || "";

  const qPhqa_Image = [
    { src: "/image/Q1-01.png", alt: "PHQA Image 1" },
    { src: "/image/Q1-02.png", alt: "PHQA Image 2" },
    { src: "/image/Q1-03.png", alt: "PHQA Image 3" },
    { src: "/image/Q1-04.png", alt: "PHQA Image 4" },
    { src: "/image/Q1-05.png", alt: "PHQA Image 5" },
    { src: "/image/Q1-06.png", alt: "PHQA Image 6" },
    { src: "/image/Q1-07.png", alt: "PHQA Image 7" },
    { src: "/image/Q1-08.png", alt: "PHQA Image 8" },
    { src: "/image/Q1-09.png", alt: "PHQA Image 9" },
  ].map((image, index) => (
    <Image
      key={index}
      alt={image.alt}
      className="h-[20vh]"
      loading="lazy"
      src={image.src}
    />
  ));

  const q2_Image = [
    { src: "/image/Q2-01.png", alt: "PHQA Addon Image 1" },
    { src: "/image/Q2-02.png", alt: "PHQA Addon Image 2" },
  ].map((image, index) => (
    <Image
      key={index}
      alt={image.alt}
      className="h-[20vh]"
      loading="lazy"
      src={image.src}
    />
  ));

  const phqaInitValue: Questions_PHQA = {
    id: "",
    questions_MasterId: "",
    q1: 99,
    q2: 99,
    q3: 99,
    q4: 99,
    q5: 99,
    q6: 99,
    q7: 99,
    q8: 99,
    q9: 99,
    sum: 0,
  };

  const Q2InitValue: Questions_PHQA_Addon = {
    id: "",
    questions_MasterId: "",
    q1: 99,
    q2: 99,
  };

  const phqaAddonInitValue: Questions_PHQA_Addon = {
    id: "",
    questions_MasterId: "",
    q1: 99,
    q2: 99,
  };

  const router = useRouter();
  const { data: session, status } = useSession();
  const [questionName, setQuestionName] = useState("2Q");
  const [progress, setProgress] = useState(0);
  const [showPHQA, setPHQAShow] = useState(false);
  const [showPHQAAddon, setPHQAAddonShow] = useState(false);
  const [canProceed, setCanProceed] = useState(false);
  const [lastQuestionAnswered, setLastQuestionAnswered] = useState(false);
  const [profileIdState, setProfileIdState] = useState("");
  const [referenceId, setReferenceId] = useState("");
  const [referentData, setReferentData] = useState<{
    fullName: string;
    affiliation: string;
    agency: string;
  }>();
  const [question, setQuestion] = useState("1");
  const [currentAnswer, setCurrentAnswer] = useState<string>("");
  const [isModalOpened, setIsModalOpened] = useState(false);
  const [isOtpEmpty, setIsOtpEmpty] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentQuestionAnswers, setCurrentQuestionAnswers] = useState<{
    [key: string]: string;
  }>({});

  const [phqa_data, setPHQA] = useState<Questions_PHQA>(phqaInitValue);
  const [Q2_data, setQ2] = useState<Questions_PHQA_Addon>(Q2InitValue);
  const [phqaAddon_data, setPHQAAddon] =
    useState<Questions_PHQA_Addon>(phqaAddonInitValue);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [location, setLocation] = useState<LocationData>();
  const [calculationResult, setCalculationResult] = useState<{
    phqa_sum: number;
    result: string;
    result_text: string;
    q9_value: number;
  } | null>(null);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const checkProfile = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/profile/user/${id}`);
        const data = await response.json();

        if (data?.profile.length === 0) {
          router.push("/liff/privacy");
        } else {
          setProfileIdState(data?.profile[0].id);
        }
      } catch (error) {
        setErrorMessage(
          "เกิดข้อผิดพลาดในการตรวจสอบข้อมูลผู้ใช้งาน กรุณาลองใหม่อีกครั้ง" +
            error
        );
        setIsModalOpened(true);
        router.push("/liff");
      }
    },
    [profileId, router]
  );

  useEffect(() => {
    if (status !== "loading" && status === "authenticated") {
      if (profileId) {
        setProfileIdState(profileId);
      } else {
        checkProfile(session?.user?.id as string);
      }
    } else {
      setProfileIdState(profileId);
    }

    // ตรวจสอบ QR code data
    if (ref) {
      setReferenceId(ref);
    } else {
      onOpen();
    }

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(({ coords }) => {
        const { accuracy, latitude, longitude } = coords;

        setLocation({ accuracy, latitude, longitude });
      });
    }

    // เริ่มต้น progress ที่ 0%
    setProgress(0);
  }, [session, status, profileId, ref, checkProfile, onOpen]);

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

  const ReferChange = useCallback(
    (e: React.FormEvent<HTMLDivElement> | string) => {
      const value =
        typeof e === "string"
          ? e
          : ((
              e as React.FormEvent<HTMLDivElement>
            ).currentTarget?.querySelector?.<HTMLInputElement>("input")
              ?.value ?? "");

      setReferenceId(value);
      setIsOtpEmpty(value.length < 3);
      if (value.length === 3) {
        fetchReferentData(value);
      }
    },
    [fetchReferentData]
  );

  const calProgress = useCallback((e: number) => {
    // จำนวนคำถามทั้งหมด: 2Q(2) + PHQ-A(9) + PHQA Addon(2) = 13 คำถาม
    const totalQuestions = 13;
    const currentQuestion = e - 1; // ลบ 1 เพื่อให้เริ่มจาก 0

    // คำนวณเปอร์เซ็นต์ความคืบหน้า (100/13 ≈ 7.7% ต่อข้อ)
    const progress = Math.round((currentQuestion * 100) / totalQuestions);

    return progress;
  }, []);

  const phqaChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const Question = parseInt(e.target.name, 10);
      const name = "q" + e.target.name;
      const value = e.target.value;

      setCurrentAnswer(value);
      setCanProceed(true);
      setCurrentQuestionAnswers((prev) => {
        const newAnswers = {
          ...prev,
          [Question]: value,
        };

        return newAnswers;
      });

      setPHQA((prev) => {
        const newData = {
          ...prev,
          [name]: parseInt(value, 10),
        };

        // คำนวณผลรวมของคำตอบ PHQ-A
        const sum = Object.keys(newData)
          .filter((key) => key.startsWith("q") && key !== "questions_MasterId")
          .reduce(
            (acc: number, key: string) =>
              acc + (Number(newData[key as keyof Questions_PHQA]) || 0),
            0
          );

        return { ...newData, sum };
      });

      if (Question === 9) {
        setLastQuestionAnswered(true);
      }
    },
    [currentQuestionAnswers]
  );

  const Q2Change = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const Question = parseInt(e.target.name, 10);
    const name = "q" + Question;
    const value = parseInt(e.target.value);

    setCurrentAnswer(value.toString());
    setCanProceed(true);
    setCurrentQuestionAnswers((prev) => ({
      ...prev,
      [Question]: value.toString(),
    }));

    setQ2((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (Question === 2) {
      setLastQuestionAnswered(true);
    }
  }, []);

  const phqaAddonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const Question = parseInt(e.target.name, 10);
    const name = "q" + (Question - 11); // แปลงจาก q12, q13 เป็น q1, q2
    const value = parseInt(e.target.value, 10);

    setCurrentAnswer(value.toString());
    setCanProceed(true);
    setCurrentQuestionAnswers((prev) => ({
      ...prev,
      [Question]: value.toString(),
    }));

    setPHQAAddon((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (Question === 13) {
      setLastQuestionAnswered(true);
    }
  };

  const handleNext = useCallback(() => {
    const currentQuestion = parseInt(question);

    if (currentQuestion === 2) {
      setPHQAShow(true);
      setQuestionName("PHQ-A");
      setQuestion("3"); // เริ่ม PHQ-A ที่ 3
      setProgress(calProgress(3));
      setCurrentAnswer("");
      setCanProceed(false);
      setCurrentQuestionAnswers({}); // รีเซ็ตคำตอบทั้งหมด
      setLastQuestionAnswered(false);
    } else if (currentQuestion >= 3 && currentQuestion < 11) {
      const nextQuestion = currentQuestion + 1;

      setProgress(calProgress(nextQuestion));
      setQuestion(nextQuestion.toString());
      setCurrentAnswer("");
      setCanProceed(false);
    } else if (currentQuestion === 11) {
      // จบ PHQ-A
      setPHQAShow(false);
      setPHQAAddonShow(true);
      setQuestionName("PHQ-A Addon");
      setQuestion("12"); // เริ่ม PHQA Addon
      setProgress(calProgress(12));
      setCurrentAnswer("");
      setCanProceed(false);
      setLastQuestionAnswered(false);
    } else if (currentQuestion >= 12 && currentQuestion < 13) {
      const nextQuestion = currentQuestion + 1;

      setProgress(calProgress(nextQuestion));
      setQuestion(nextQuestion.toString());
      setCurrentAnswer("");
      setCanProceed(false);
    } else if (currentQuestion === 13) {
      // จบ PHQA Addon และบันทึกผลทันที
      setProgress(100); // แสดง 100% เมื่อบันทึกผล
      SaveToDB();
    } else {
      const nextQuestion = currentQuestion + 1;

      setProgress(calProgress(nextQuestion));
      setQuestion(nextQuestion.toString());
      setCurrentAnswer("");
      setCanProceed(false);
    }
  }, [question, calProgress]);

  const SaveToDB = async () => {
    setIsSaving(true);

    // ตรวจสอบว่ามีข้อมูลครบถ้วนหรือไม่
    if (!profileIdState) {
      setErrorMessage("ไม่พบข้อมูลผู้ใช้งาน กรุณาลงทะเบียนใหม่");
      setIsModalOpened(true);
      setIsSaving(false);

      return;
    }

    // ตรวจสอบ PHQA
    const phqaAnswers = Object.entries(phqa_data)
      .filter(([key]) => key.startsWith("q") && key !== "questions_MasterId")
      .map(([_, value]) => Number(value));

    const hasAllPhqaAnswers = phqaAnswers.every(
      (value) => !isNaN(value) && value >= 0 && value <= 3
    );

    if (!hasAllPhqaAnswers) {
      setErrorMessage("กรุณาตอบคำถาม PHQ-A ให้ครบทุกข้อ");
      setIsModalOpened(true);
      setIsSaving(false);

      return;
    }

    // ตรวจสอบ Q2
    const q2Answers = Object.entries(Q2_data)
      .filter(([key]) => key.startsWith("q") && key !== "questions_MasterId")
      .map(([_, value]) => Number(value));

    const hasAllQ2Answers = q2Answers.every(
      (value) => !isNaN(value) && value >= 0 && value <= 1
    );

    if (!hasAllQ2Answers) {
      setErrorMessage("กรุณาตอบคำถามแนบท้ายให้ครบทุกข้อ");
      setIsModalOpened(true);
      setIsSaving(false);

      return;
    }

    const phqaAddonAnswers = {
      q1: phqaAddon_data.q1,
      q2: phqaAddon_data.q2,
    };

    const hasAllPhqaAddonAnswers =
      !isNaN(phqaAddonAnswers.q1) &&
      phqaAddonAnswers.q1 >= 0 &&
      phqaAddonAnswers.q1 <= 1 &&
      !isNaN(phqaAddonAnswers.q2) &&
      phqaAddonAnswers.q2 >= 0 &&
      phqaAddonAnswers.q2 <= 1;

    if (!hasAllPhqaAddonAnswers) {
      setErrorMessage("กรุณาตอบคำถาม PHQ-A Addon ให้ครบทุกข้อ");
      setIsModalOpened(true);
      setIsSaving(false);

      return;
    }

    // คำนวณผลรวม
    const sum = phqaAnswers.reduce((acc: number, val: number) => acc + val, 0);

    const dataToSave = {
      profileId: profileIdState,
      phqa: {
        ...phqa_data,
        sum: sum,
      },
      Q2: Q2_data,
      phqaAddon: phqaAddon_data,
      location: location || null,
      reference: referenceId ? parseInt(referenceId) : null,
    };

    try {
      const response = await fetch("/api/question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSave),
      });

      const responseData = await response.json();

      if (response.ok) {
        setCalculationResult({
          phqa_sum: sum,
          result: responseData.data.result,
          result_text: responseData.data.result_text,
          q9_value: phqa_data.q9,
        });
      } else {
        setErrorMessage(
          `เกิดข้อผิดพลาดในการบันทึกข้อมูล: ${responseData.message || "กรุณาลองใหม่อีกครั้ง"}`
        );
        setIsModalOpened(true);
      }
    } catch (error) {
      setErrorMessage(
        `เกิดข้อผิดพลาดในการบันทึกข้อมูล: ${error instanceof Error ? error.message : "กรุณาลองใหม่อีกครั้ง"}`
      );
      setIsModalOpened(true);
    } finally {
      setIsSaving(false);
    }
  };

  const BackStep = useCallback(async () => {
    const Question = parseInt(question);

    if (Question === 1) {
      router.back();

      return;
    }

    if (Question === 0) {
      router.back();

      return;
    }

    if (Question === 3) {
      setPHQAShow(false);
      setQuestionName("คำถามแนบท้าย");
      setQuestion("2");
      setProgress(calProgress(2));
      setCanProceed(true);
      setCurrentAnswer(currentQuestionAnswers[2] || "");

      return;
    }

    if (Question === 12) {
      setPHQAAddonShow(false);
      setPHQAShow(true);
      setQuestionName("PHQ-A");
      setQuestion("11");
      setProgress(calProgress(11));
      setCanProceed(true);
      setCurrentAnswer(currentQuestionAnswers[11] || "");

      return;
    }

    setProgress(calProgress(Question - 1));
    setQuestion((Question - 1).toString());
    setCanProceed(true);
    setCurrentAnswer(currentQuestionAnswers[Question - 1] || "");

    if (Question === 9) {
      setPHQAShow(true);
    }
  }, [question, calProgress, router, currentQuestionAnswers]);

  useEffect(() => {
    if (
      showPHQAAddon &&
      phqaAddon_data.q1 !== 99 &&
      phqaAddon_data.q2 !== 99 &&
      lastQuestionAnswered
    ) {
      // ลบการบันทึกอัตโนมัติออก
      // SaveToDB();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phqaAddon_data]);

  return (
    <section className="flex flex-col w-[calc(100vw)] items-center justify-center gap-4 pt-10 px-8 py-8 md:py-10">
      <Suspense fallback={<Loading />}>
        <Modal
          backdrop="blur"
          hideCloseButton={true}
          isDismissable={false}
          isKeyboardDismissDisabled={true}
          isOpen={isOpen}
          placement="center"
          size="xs"
          onOpenChange={onOpenChange}
        >
          <ModalContent>
            {() => (
              <>
                <ModalHeader className="flex flex-col items-center font-semibold text-2xl">
                  กรอกรหัสผู้ให้คำแนะนำ
                </ModalHeader>
                <ModalBody className="items-center text-center">
                  <Divider />
                  <div className="flex justify-center">
                    <InputOtp
                      className="items-center"
                      errorMessage="กรุณากรอกรหัสผู้ให้คำแนะนำให้ถูกต้อง"
                      length={3}
                      radius="lg"
                      size="lg"
                      value={referenceId}
                      variant="bordered"
                      onChange={(val) => ReferChange(val)}
                    />
                  </div>
                  <Divider />
                  {referenceId.length == 3 &&
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
                </ModalBody>
                <ModalFooter className="flex flex-col justify-center">
                  <Button
                    className="w-full"
                    color="primary"
                    isDisabled={
                      isOtpEmpty ||
                      isLoading ||
                      (typeof referentData !== "string" &&
                        referentData?.fullName === "ไม่พบข้อมูล")
                    }
                    radius="full"
                    variant="solid"
                    onPress={() => onOpenChange()}
                  >
                    ถัดไป
                  </Button>
                  <Button
                    className="w-full"
                    color="default"
                    radius="full"
                    variant="bordered"
                    onPress={() => {
                      setReferenceId("");
                      onOpenChange();
                    }}
                  >
                    ข้าม
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        <Modal
          backdrop="blur"
          isOpen={isModalOpened}
          placement="center"
          size="xs"
          onOpenChange={() => setIsModalOpened(false)}
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
                    onPress={() => setIsModalOpened(false)}
                  >
                    ตกลง
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        <h1 className={title({ size: "xs" })}>
          แบบประเมินภาวะซึมเศร้าในวัยรุ่น
        </h1>

        <Progress
          aria-label="Loading..."
          className="max-w-md"
          showValueLabel={true}
          value={progress}
        />

        {calculationResult && (
          <Modal
            backdrop="blur"
            hideCloseButton={false}
            isDismissable={true}
            isOpen={true}
            placement="center"
            size="xs"
            onClose={() => {
              setCalculationResult(null);
              router.push("/liff");
            }}
          >
            <ModalContent>
              {() => (
                <>
                  <ModalHeader className="flex flex-col items-center font-semibold text-2xl">
                    ผลการประเมิน
                  </ModalHeader>
                  <ModalBody className="items-center text-center">
                    <div className="w-full space-y-4">
                      <p>
                        <span className="font-semibold">คะแนนรวม:</span>{" "}
                        {calculationResult.phqa_sum} คะแนน
                      </p>
                      <div className="w-full space-y-2">
                        <div className="flex flex-col gap-2 justify-center items-center">
                          <div className="flex flex-col gap-1">
                            <div className="flex flex-col items-center gap-2">
                              <span
                                className={`
                                ${
                                  calculationResult.result === "Green"
                                    ? "text-green-700"
                                    : calculationResult.result === "Green-Low"
                                      ? "text-green-600"
                                      : calculationResult.result === "Yellow"
                                        ? "text-yellow-700"
                                        : calculationResult.result === "Orange"
                                          ? "text-orange-700"
                                          : "text-red-700"
                                }
                              `}
                              >
                                {calculationResult.result_text}
                              </span>
                            </div>
                            <div className="flex w-full h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  calculationResult.result === "Green"
                                    ? "bg-green-200 w-full"
                                    : calculationResult.result === "Green-Low"
                                      ? "bg-green-400 w-full"
                                      : calculationResult.result === "Yellow"
                                        ? "bg-yellow-500 w-full"
                                        : calculationResult.result === "Orange"
                                          ? "bg-orange-500 w-full"
                                          : "bg-red-500 w-full"
                                }`}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      {calculationResult.q9_value > 0 && (
                        <p className="text-center">
                          <span className="font-semibold">
                            ความเสี่ยงในการทำร้ายตนเอง:
                          </span>{" "}
                          พบความเสี่ยงในการทำร้ายตนเอง
                        </p>
                      )}
                    </div>
                  </ModalBody>
                  <ModalFooter className="flex flex-col justify-center">
                    <Button
                      className="w-full"
                      color="primary"
                      isLoading={isNavigating}
                      radius="full"
                      variant="solid"
                      onPress={() => {
                        setIsNavigating(true);
                        router.push("/liff");
                      }}
                    >
                      กลับหน้าหลัก
                    </Button>
                  </ModalFooter>
                </>
              )}
            </ModalContent>
          </Modal>
        )}

        <div className="flex flex-col w-full min-h-[calc(100vh_-_350px)]">
          <h2 className={subtitle()}>{questionName}</h2>
          <Tabs
            aria-label="Options"
            className="max-w-xs"
            classNames={{ tabList: "invisible" }}
            color="primary"
            selectedKey={question}
            variant="underlined"
          >
            {!showPHQA && !showPHQAAddon
              ? q2.map((val, index) => (
                  <Tab key={(index + 1).toString()}>
                    <div className="flex flex-col gap-4 mt-[-50px]">
                      <div className="flex flex-col items-center">
                        {q2_Image[index]}
                      </div>
                      <div className="flex flex-col gap-4 items-start text-start">
                        <p className="text-primary-500 font-semibold">
                          {index + 1}. {val}
                        </p>
                        <div className="flex flex-col gap-2 w-full mt-[-15px] ml-[-5px]">
                          <RadioGroup
                            key={index}
                            className="pl-5"
                            label="เลือกข้อที่รู้สึกตรงกับตัวเอง"
                            name={(index + 1).toString()}
                            value={currentAnswer}
                            onChange={(val) => {
                              Q2Change(val);
                            }}
                          >
                            <Radio
                              className="inline-flex m-0 items-center justify-between flex-row-reverse max-w-full cursor-pointer rounded-xl p-3 border"
                              value="0"
                            >
                              ไม่ใช่
                            </Radio>
                            <Radio
                              className="inline-flex m-0 items-center justify-between flex-row-reverse max-w-full cursor-pointer rounded-xl p-3 border"
                              value="1"
                            >
                              ใช่
                            </Radio>
                          </RadioGroup>
                        </div>
                      </div>
                    </div>
                  </Tab>
                ))
              : showPHQA
                ? qPhqa.map((val, index) => {
                    const questionNumber = index + 1;

                    return (
                      <Tab key={(index + 3).toString()}>
                        <div className="flex flex-col gap-4 mt-[-50px]">
                          <div className="flex flex-col items-center">
                            {qPhqa_Image[index]}
                          </div>
                          <div className="flex flex-col gap-4 items-start text-start">
                            <p className="text-primary-500 font-semibold">
                              {questionNumber}. {val}
                            </p>
                            <div className="flex flex-col gap-2 w-full mt-[-15px] ml-[-5px]">
                              <RadioGroup
                                key={`phqa-${questionNumber}`}
                                className="pl-5"
                                label="ในช่วง 2 สัปดาห์ คุณมีอาการเหล่านี้บ่อยแค่ไหน"
                                name={questionNumber.toString()}
                                value={
                                  currentQuestionAnswers[questionNumber] || ""
                                }
                                onChange={(val) => {
                                  phqaChange(val);
                                }}
                              >
                                <Radio
                                  className="inline-flex m-0 items-center justify-between flex-row-reverse max-w-full cursor-pointer rounded-xl p-3 border"
                                  value="0"
                                >
                                  ไม่มีเลย
                                </Radio>
                                <Radio
                                  className="inline-flex m-0 items-center justify-between flex-row-reverse max-w-full cursor-pointer rounded-xl p-3 border"
                                  value="1"
                                >
                                  มีบางวัน
                                </Radio>
                                <Radio
                                  className="inline-flex m-0 items-center justify-between flex-row-reverse max-w-full cursor-pointer rounded-xl p-3 border"
                                  value="2"
                                >
                                  มีมากกว่า 7 วัน
                                </Radio>
                                <Radio
                                  className="inline-flex m-0 items-center justify-between flex-row-reverse max-w-full cursor-pointer rounded-xl p-3 border"
                                  value="3"
                                >
                                  มีแทบทุกวัน
                                </Radio>
                              </RadioGroup>
                            </div>
                          </div>
                        </div>
                      </Tab>
                    );
                  })
                : phqaAddon.map((val, index) => {
                    const questionNumber = index + 1;

                    return (
                      <Tab key={(index + 12).toString()}>
                        <div className="flex flex-col gap-4 mt-[-50px]">
                          <div className="flex flex-col items-center">
                            {qPhqa_Image[index]}
                          </div>
                          <div className="flex flex-col gap-4 items-start text-start">
                            <p className="text-primary-500 font-semibold">
                              {questionNumber}. {val}
                            </p>
                            <div className="flex flex-col gap-2 w-full mt-[-15px] ml-[-5px]">
                              <RadioGroup
                                key={`phqa-addon-${questionNumber}`}
                                className="pl-5"
                                label="เลือกข้อที่รู้สึกตรงกับตัวเอง"
                                name={(questionNumber + 11).toString()}
                                value={
                                  currentQuestionAnswers[questionNumber + 11] ||
                                  ""
                                }
                                onChange={(val) => {
                                  phqaAddonChange(val);
                                }}
                              >
                                <Radio
                                  className="inline-flex m-0 items-center justify-between flex-row-reverse max-w-full cursor-pointer rounded-xl p-3 border"
                                  value="0"
                                >
                                  ไม่ใช่
                                </Radio>
                                <Radio
                                  className="inline-flex m-0 items-center justify-between flex-row-reverse max-w-full cursor-pointer rounded-xl p-3 border"
                                  value="1"
                                >
                                  ใช่
                                </Radio>
                              </RadioGroup>
                            </div>
                          </div>
                        </div>
                      </Tab>
                    );
                  })}
          </Tabs>
        </div>

        <Button
          className="w-full"
          color="default"
          radius="full"
          size="lg"
          variant="bordered"
          onPress={() => BackStep()}
        >
          ย้อนกลับ
        </Button>

        <Button
          className="w-full"
          color="primary"
          isDisabled={
            !canProceed ||
            isSaving ||
            (question === "13" && !lastQuestionAnswered)
          }
          isLoading={isSaving}
          radius="full"
          size="lg"
          variant="solid"
          onPress={() => {
            if (question === "13") {
              SaveToDB();
            } else {
              handleNext();
            }
          }}
        >
          {question === "13" ? "บันทึกผล" : "ถัดไป"}
        </Button>
      </Suspense>
    </section>
  );
}
