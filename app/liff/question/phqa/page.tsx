"use client";

import { Button } from "@heroui/button";
import { Tab, Tabs } from "@heroui/tabs";
import { Progress } from "@heroui/progress";
import { Image } from "@heroui/image";
import { Questions_PHQA, Questions_PHQA_Addon } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
import { q2, qPhqa } from "@/app/data";

export default function PHQAPage({ ref, id }: { ref: string; id: string }) {
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
    q1: 1,
    q2: 1,
  };

  const router = useRouter();
  const { data: session, status } = useSession();
  const [questionName, setQuestionName] = useState("2Q");
  const [progress, setProgress] = useState(0);
  const [showPHQA, setPHQAShow] = useState(false);
  const [submit, setSubmit] = useState(true);
  const [canProceed, setCanProceed] = useState(false);
  const [lastQuestionAnswered, setLastQuestionAnswered] = useState(false);
  // const [userId, setUserId] = useState("");
  const [profileId, setProfileId] = useState("");
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
  const [currentQuestionAnswers, setCurrentQuestionAnswers] = useState<{ [key: string]: string }>({});

  const [phqa_data, setPHQA] = useState<Questions_PHQA>(phqaInitValue);
  const [Q2_data, setQ2] = useState<Questions_PHQA_Addon>(Q2InitValue);
  const [location, setLocation] = useState<LocationData>();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const checkProfile = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/profile/user/${id}`);
        const data = await response.json();

        if (data?.profile.length === 0) {
          router.push("/liff/privacy");
        } else {
          setProfileId(data?.profile[0].id);
        }
      } catch (error) {
        router.push("/liff");
      }
    },
    [profileId, router]
  );

  useEffect(() => {
    if (status !== "loading" && status === "authenticated") {
      checkProfile(session?.user?.id as string);
      // console.log("Authenticated");
    } else {
      // setProfileId(id);
      // console.log("Un Authenticated");
    }

    //setReferenceId(ref);

    //console.log(profileId, " : ", referenceId);

    // if ("geolocation" in navigator) {
    //   navigator.geolocation.getCurrentPosition(({ coords }) => {
    //     const { accuracy, latitude, longitude } = coords;

    //     setLocation({ accuracy, latitude, longitude });
    //   });
    // }

    // if (referenceId === "" && !isModalOpened) {
    //   onOpen();
    //   setIsModalOpened(true);
    // }
  }, [session, isModalOpened, checkProfile, referenceId, profileId]);


  const fetchReferentData = useCallback(async (id: string) => {
    const referentId = parseInt(id);

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
    }
  }, []);

  const ReferChange = useCallback(
    (e: any) => {
      setReferenceId(e.target.value);
      setIsOtpEmpty(e.target.value.length < 3);
      if (e.target.value.length == 3) {
        fetchReferentData(e.target.value);
      }
    },
    [fetchReferentData]
  );

  const calProgress = useCallback((e: number) => {
    const total = qPhqa.length + q2.length;
    const question = e;

    // คำนวณเปอร์เซ็นต์รวมทั้งหมด
    return (question * 100) / total;
  }, []);

  const phqaChange = useCallback((e: any) => {
    const Question = parseInt(e.target.name);
    const name = "q" + e.target.name;
    const value = e.target.value;

    setCurrentAnswer(value);
    setCanProceed(true);
    setCurrentQuestionAnswers(prev => ({
      ...prev,
      [Question]: value
    }));

    setPHQA((prev: any) => {
      const newData = {
        ...prev,
        [name]: parseInt(value),
      };
      
      // คำนวณผลรวมของคำตอบ PHQ-A
      const sum = Object.keys(newData)
        .filter(key => key.startsWith('q') && key !== 'questions_MasterId')
        .reduce((acc, key) => acc + (newData[key] || 0), 0);
      
      return {
        ...newData,
        sum: sum
      };
    });

    if (Question === 9) {
      setLastQuestionAnswered(true);
      console.log("ข้อมูลที่จะบันทึก:", {
        profileId: profileId,
        phqa: phqa_data,
        Q2: Q2_data,
        location: location,
        reference: parseInt(referenceId),
      });
    }
  }, [profileId, phqa_data, Q2_data, location, referenceId]);

  const Q2Change = useCallback((e: any) => {
    const Question = parseInt(e.target.name);
    const name = "q" + Question;
    const value = e.target.value;

    setCurrentAnswer(value);
    setCanProceed(true);
    setCurrentQuestionAnswers(prev => ({
      ...prev,
      [Question]: value
    }));

    setQ2((prev: any) => ({
      ...prev,
      [name]: parseInt(value),
    }));

    if (Question === 2) {
      setSubmit(false);
    }
  }, []);

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
    } else if (currentQuestion >= 3 && currentQuestion < 11) {
      const nextQuestion = currentQuestion + 1;
      setProgress(calProgress(nextQuestion));
      setQuestion(nextQuestion.toString());
      setCurrentAnswer("");
      setCanProceed(false);
    } else if (currentQuestion === 11) {
      // จบ PHQ-A
      setPHQAShow(false);
      setQuestionName("สรุปผล");
      setQuestion("10"); // ไปหน้าสรุป/บันทึกผล
      setProgress(100);
      setCurrentAnswer("");
      setCanProceed(false);
    } else {
      const nextQuestion = currentQuestion + 1;
      setProgress(calProgress(nextQuestion));
      setQuestion(nextQuestion.toString());
      setCurrentAnswer("");
      setCanProceed(false);
    }
  }, [question, calProgress]);

  const SaveToDB = async () => {
    // ตรวจสอบว่ามีข้อมูลครบถ้วนหรือไม่
    if (!profileId || !location || !referenceId) {
      console.error("ข้อมูลไม่ครบถ้วน");
      return;
    }

    // ตรวจสอบว่าตอบคำถามครบทุกข้อหรือไม่
    const hasAllAnswers = Object.values(phqa_data)
      .filter(value => typeof value === 'number' && value !== 99)
      .length === 9;

    if (!hasAllAnswers) {
      console.error("ยังไม่ได้ตอบคำถามครบทุกข้อ");
      return;
    }

    const data = JSON.stringify({
      profileId: profileId,
      phqa: phqa_data,
      Q2: Q2_data,
      location: location,
      reference: parseInt(referenceId),
    });

    await fetch("/api/question", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: data,
    }).then((res) =>
      res.json().then(() => {
        if (res.status === 200) {
          router.push("/liff/question/list");
        }
      })
    );
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

    setProgress(calProgress(Question - 1));
    setQuestion((Question - 1).toString());
    setCanProceed(true);
    setCurrentAnswer(currentQuestionAnswers[Question - 1] || "");

    if (Question == 9) {
      setPHQAShow(true);
    }
  }, [question, calProgress, router, currentQuestionAnswers]);

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
                    (referentData?.fullName !== "ไม่พบข้อมูล" ? (
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
                    onPress={() => onOpenChange()}
                  >
                    ข้าม
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
            {!showPHQA ? (
              q2.map((val, index) => (
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
            ) : (
              qPhqa.map((val, index) => {
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
                            value={currentQuestionAnswers[questionNumber] || ""}
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
            )}
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

        {question == "11" ? (
          <Button
            className="w-full"
            color="primary"
            isDisabled={submit || !lastQuestionAnswered}
            radius="full"
            size="lg"
            variant="solid"
            onPress={() => SaveToDB()}
          >
            บันทึกผล
          </Button>
        ) : (
          <Button
            className="w-full"
            color="primary"
            isDisabled={!canProceed}
            radius="full"
            size="lg"
            variant="solid"
            onPress={() => handleNext()}
          >
            ถัดไป
          </Button>
        )}

      </Suspense>
    </section>
  );
}
