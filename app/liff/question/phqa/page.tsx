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
  useDisclosure,
} from "@heroui/modal";
import { Divider, InputOtp } from "@heroui/react";

import { subtitle, title } from "@/components/primitives";
import { LocationData } from "@/types";
import Loading from "@/app/loading";
import { qPhqa_addon, qPhqa } from "@/app/data";

export default function PHQAPage() {
  const qPhqa_Image = (key: number) => [
    <Image
      key={key}
      alt="PHQA Image"
      className="h-[20vh]"
      loading="lazy"
      src="/image/Q1-01.png"
    />,
    <Image
      key={key}
      alt="PHQA Image"
      className="h-[20vh]"
      loading="lazy"
      src="/image/Q1-02.png"
    />,
    <Image
      key={key}
      alt="PHQA Image"
      className="h-[20vh]"
      loading="lazy"
      src="/image/Q1-03.png"
    />,
    <Image
      key={key}
      alt="PHQA Image"
      className="h-[20vh]"
      loading="lazy"
      src="/image/Q1-04.png"
    />,
    <Image
      key={key}
      alt="PHQA Image"
      className="h-[20vh]"
      loading="lazy"
      src="/image/Q1-05.png"
    />,
    <Image
      key={key}
      alt="PHQA Image"
      className="h-[20vh]"
      loading="lazy"
      src="/image/Q1-06.png"
    />,
    <Image
      key={key}
      alt="PHQA Image"
      className="h-[20vh]"
      loading="lazy"
      src="/image/Q1-07.png"
    />,
    <Image
      key={key}
      alt="PHQA Image"
      className="h-[20vh]"
      loading="lazy"
      src="/image/Q1-08.png"
    />,
    <Image
      key={key}
      alt="PHQA Image"
      className="h-[20vh]"
      loading="lazy"
      src="/image/Q1-09.png"
    />,
  ];

  const qPhqa_addon_Image = (key: number) => [
    <Image
      key={key}
      alt="PHQA Image"
      className="h-[20vh]"
      loading="lazy"
      src="/image/Q2-01.png"
    />,
    <Image
      key={key}
      alt="PHQA Image"
      className="h-[20vh]"
      loading="lazy"
      src="/image/Q2-02.png"
    />,
  ];

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

  const phqaAddonInitValue: Questions_PHQA_Addon = {
    id: "",
    questions_MasterId: "",
    q1: 1,
    q2: 1,
  };

  const router = useRouter();
  const { data: session, status } = useSession();
  const [questionName, setQuestionName] = useState("PHQ-A");
  const [progress, setProgress] = useState(9);
  const [showPHQA, setPHQAShow] = useState(true);
  const [submit, setSubmit] = useState(true);
  const [userId, setUserId] = useState("");
  const [referenceId, setReferenceId] = useState("");
  const [referentData, setReferentData] = useState<{fullName:string,affiliation:string,agency:string} | string>("ไม่พบข้อมูล");
  const [question, setQuestion] = useState("0");
  const [isModalOpened, setIsModalOpened] = useState(false);
  const [isOtpEmpty, setIsOtpEmpty] = useState(true);

  const [phqa_data, setPHQA] = useState<Questions_PHQA>(phqaInitValue);
  const [phqa_addon_data, setPhqaAddon] =
    useState<Questions_PHQA_Addon>(phqaAddonInitValue);
  const [location, setLocation] = useState<LocationData>();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  useEffect(() => {
    if (status !== "loading" && status === "authenticated") {
      setUserId(session?.user?.id as string);

      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(({ coords }) => {
          const { accuracy, latitude, longitude } = coords;

          setLocation({ accuracy, latitude, longitude });
        });
      }

      if (referenceId === "" && !isModalOpened) {
        onOpen();
        setIsModalOpened(true);
      }
    }
  }, [session, isModalOpened]);

  const fetchReferentData = useCallback(async (id: string) => {
    const referentId = parseInt(id);

    try {
      const response = await fetch(`/api/data/referent/${referentId}`);
      const data = await response.json();
      const fullName = data[0].firstname + " " + data[0].lastname;
      const affiliation = data[0].affiliation.name;
      const agency = data[0].agency;

      setReferentData({
        fullName:fullName,
        affiliation:affiliation,
        agency:agency
      });
    } catch (error) {
      setReferentData({
        fullName:"ไม่พบข้อมูล",
        affiliation:"ไม่พบข้อมูล",
        agency:"ไม่พบข้อมูล"
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
    const total = qPhqa.length + qPhqa_addon.length;
    const question = e;

    return (question * 100) / total;
  }, []);

  const phqaChange = useCallback((e: any) => {
    const Question = parseInt(e.target.name);
    const name = "q" + e.target.name;
    const value = parseInt(e.target.value);

    setQuestion(Question.toString());

    if (Question == 9) {
      setPHQA((prev: any) => ({
        ...prev,
        [name]: value,
      }));
      setQuestionName("คำถามแนบท้าย");
      setPHQAShow(false);
    } else {
      setProgress(calProgress(Question + 1));
      setPHQA((prev: any) => ({
        ...prev,
        [name]: value,
      }));
    }
  }, []);

  const phqaAddonChange = useCallback((e: any) => {
    const Question = parseInt(e.target.name);
    const name = "q" + (parseInt(e.target.name) - 9);
    const value = parseInt(e.target.value);

    setProgress(calProgress(Question + 1));
    if (Question < 11) {
      setQuestion(Question.toString());
    } else {
      setSubmit(false);
    }

    setPhqaAddon((prev: any) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const SaveToDB = async () => {
    const data = JSON.stringify({
      userId: userId,
      phqa: phqa_data,
      phqa_addon: phqa_addon_data,
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

    setProgress(calProgress(Question - 1));
    setQuestion((Question - 1).toString());
    if (Question == 9) {
      setPHQAShow(true);
    } else if (Question == 0) {
      router.back();
    }
  }, [question, calProgress]);

  return (
    <section className="flex flex-col w-[calc(100vw)] items-center justify-center gap-4 pt-10 px-8 py-8 md:py-10">
      <Suspense fallback={<Loading />}>
        <Modal
          backdrop="opaque"
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
                <ModalBody className="items-center text-center pt-10">
                  <h2 className={title({ size: "xs" })}>
                    กรอกรหัสผู้ให้คำแนะนำ
                  </h2>
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
                  {referenceId.length >= 3 && typeof referentData !== "string" && (
                    <>
                      <span className="flex flex-col box-border rounded-lg bg-primary-100 text-primary-500 p-3 text-left w-full text-md font-semibold">
                        ชื่อผู้ให้คำแนะนำ : {referentData.fullName}
                        <br />
                        สังกัด : {referentData.affiliation}
                        <br />
                        หน่วยงาน : {referentData.agency}
                      </span>
                    </>
                  )}
                </ModalBody>
                <ModalFooter className="flex flex-col justify-center">
                  <Button
                    className="w-full"
                    color="primary"
                    isDisabled={isOtpEmpty || (typeof referentData !== "string" && referentData.fullName === "ไม่พบข้อมูล")}
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
            {showPHQA
              ? qPhqa.map((val, index) => {
                  return (
                    <Tab key={index}>
                      <div className="flex flex-col gap-4 mt-[-50px]">
                        <div className="flex flex-col items-center">
                          {qPhqa_Image(index)[index]}
                        </div>
                        <div className="flex flex-col gap-4 items-start text-start">
                          <p className="text-primary-500 font-semibold">
                            {index + 1}. {val}
                          </p>
                          <div className="flex flex-col gap-2 w-full mt-[-15px] ml-[-5px]">
                            <RadioGroup
                              key={index}
                              className="pl-5"
                              label="ในช่วง 2 สัปดาห์ คุณมีอาการเหล่านี้บ่อยแค่ไหน"
                              name={(index + 1).toString()}
                              onChange={(val) => phqaChange(val)}
                            >
                              <Radio
                                className="inline-flex m-0  items-center justify-between flex-row-reverse max-w-full cursor-pointer rounded-xl p-3 border"
                                value="0"
                              >
                                ไม่มีเลย
                              </Radio>
                              <Radio
                                className="inline-flex m-0  items-center justify-between flex-row-reverse max-w-full cursor-pointer rounded-xl p-3 border"
                                value="1"
                              >
                                มีบางวัน
                              </Radio>
                              <Radio
                                className="inline-flex m-0  items-center justify-between flex-row-reverse max-w-full cursor-pointer rounded-xl p-3 border"
                                value="2"
                              >
                                มีมากกว่า 7 วัน
                              </Radio>
                              <Radio
                                className="inline-flex m-0  items-center justify-between flex-row-reverse max-w-full cursor-pointer rounded-xl p-3 border"
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
              : qPhqa_addon.map((val, index) => {
                  return (
                    <Tab key={index + 9}>
                      <div className="flex flex-col  gap-4 mt-[-50px]">
                        <div className="flex flex-col items-center">
                          {qPhqa_addon_Image(index)[index]}
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
                              name={"1" + index.toString()}
                              value={Object.entries(val)
                                [index + 2].toString()
                                .substring(3)}
                              onChange={(val) => phqaAddonChange(val)}
                            >
                              <Radio
                                className="inline-flex m-0  items-center justify-between flex-row-reverse max-w-full cursor-pointer rounded-xl p-3 border"
                                value="0"
                              >
                                ไม่ใช่
                              </Radio>
                              <Radio
                                className="inline-flex m-0  items-center justify-between flex-row-reverse max-w-full cursor-pointer rounded-xl p-3 border"
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
        {question == "10" ? (
          <Button
            className="w-full"
            color="primary"
            isDisabled={submit}
            radius="full"
            size="lg"
            variant="solid"
            onPress={() => SaveToDB()}
          >
            บันทึกผล
          </Button>
        ) : (
          <></>
        )}
      </Suspense>
    </section>
  );
}
