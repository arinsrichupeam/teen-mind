"use client";

import { Button } from "@heroui/button";
import { Tab, Tabs } from "@heroui/tabs";
import { Progress } from "@heroui/progress";
import { Image } from "@heroui/image";
import { Questions_2Q, Questions_PHQA } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Radio, RadioGroup } from "@heroui/radio";

import { subtitle, title } from "@/components/primitives";
import { LocationData } from "@/types";

export default function PHQAPage() {
  const qPhqa = [
    "รู้สึกเศร้า หงุดหงิด หรือสิ้นหวัง",
    "เบื่อ ไม่ค่อยสนใจหรือไม่เพลิดเพลินเวลาทำสิ่งต่างๆ",
    "นอนหลับยาก รู้สึกง่วงทั้งวัน หรือนอนมากเกินไป",
    "ไม่อยากอาาหาร น้ำหนักลด หรือกินมากกว่าปกติ",
    "รู้สึกเหนื่อยล้า ไม่ค่อยมีพลัง",
    "รู้สึกแย่กับตัวเอง หรือรู้สึกว่าตัวเองล้มเหลวหรือทำให้ตัวเองหรือครอบครัวผิดหวัง",
    "จดจ่อกับสิ่งต่างๆได้ยากเช่น ทำการบ้าน อ่านหนังสือหรือดูโทรทัศน์",
    "พูดหรือทำอะไรช้าลงจนคนอื่นสังเกตเห็นได้ กระวนกระวาย จนต้องเคลื่อนไหวไปมา มากกว่าปกติ",
    "คิดว่าถ้าตายไปเสียจะดีว่า หรือคิดจะทำร้ายตัวเอง ด้วยวิธีใดวิธีหนึ่ง",
  ];

  const q2 = [
    "ใน 1 เดือนที่ผ่านมา มีช่วงไหนที่คุณมีความคิด อยากตาย หรือไม่อยากมีชีวิตอยู่ อย่างจริงจังหรือไม่",
    "ตลอดชีวิตที่ผ่านมา คุณเคยพยายามที่จะทำให้ตัวเองตาย หรือลงมือฆ่าตัวตายหรือไม",
  ];

  const qPhqa_Image = (key: number) => [
    <Image
      key={key}
      alt="PHQA Image"
      className="h-[20vh]"
      src="/image/Q1-01.png"
    />,
    <Image
      key={key}
      alt="PHQA Image"
      className="h-[20vh]"
      src="/image/Q1-02.png"
    />,
    <Image
      key={key}
      alt="PHQA Image"
      className="h-[20vh]"
      src="/image/Q1-03.png"
    />,
    <Image
      key={key}
      alt="PHQA Image"
      className="h-[20vh]"
      src="/image/Q1-04.png"
    />,
    <Image
      key={key}
      alt="PHQA Image"
      className="h-[20vh]"
      src="/image/Q1-05.png"
    />,
    <Image
      key={key}
      alt="PHQA Image"
      className="h-[20vh]"
      src="/image/Q1-06.png"
    />,
    <Image
      key={key}
      alt="PHQA Image"
      className="h-[20vh]"
      src="/image/Q1-07.png"
    />,
    <Image
      key={key}
      alt="PHQA Image"
      className="h-[20vh]"
      src="/image/Q1-08.png"
    />,
    <Image
      key={key}
      alt="PHQA Image"
      className="h-[20vh]"
      src="/image/Q1-09.png"
    />,
  ];

  const q2_Image = (key: number) => [
    <Image
      key={key}
      alt="PHQA Image"
      className="h-[20vh]"
      src="/image/Q2-01.png"
    />,
    <Image
      key={key}
      alt="PHQA Image"
      className="h-[20vh]"
      src="/image/Q2-02.png"
    />,
  ];

  const phqaInitValue: Questions_PHQA = {
    id: "",
    questions_MasterId: "",
    q1: 1,
    q2: 1,
    q3: 1,
    q4: 1,
    q5: 1,
    q6: 1,
    q7: 1,
    q8: 1,
    q9: 1,
    sum: 0,
  };

  const q2InitValue: Questions_2Q = {
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

  const [question, setQuestion] = useState("0");
  const [phqa_data, setPHQA] = useState<Questions_PHQA>(phqaInitValue);
  const [q2_data, setQ2] = useState<Questions_2Q>(q2InitValue);
  const [location, setLocation] = useState<LocationData>();

  useEffect(() => {
    if (status !== "loading" && status === "authenticated") {
      setUserId(session?.user?.id as string);
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(({ coords }) => {
          const { accuracy, latitude, longitude } = coords;

          setLocation({ accuracy, latitude, longitude });
          console.log(latitude, longitude);
        });
      }
    }
  }, [session]);

  const calProgress = (e: number) => {
    const total = qPhqa.length + q2.length;
    const question = e;

    return (question * 100) / total;
  };

  const phqaChange = (e: any) => {
    const Question = parseInt(e.target.name);

    setQuestion(Question.toString());

    if (Question == 9) {
      setQuestionName("2Q");
      setPHQAShow(false);
    } else {
      setProgress(calProgress(Question + 1));
      const name = "q" + e.target.name;
      const value = parseInt(e.target.value);

      setPHQA((prev: any) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const q2Change = (e: any) => {
    const Question = parseInt(e.target.name);
    const name = "q" + (parseInt(e.target.name) - 9);
    const value = parseInt(e.target.value);

    setProgress(calProgress(Question + 1));
    if (Question < 11) {
      setQuestion(Question.toString());
    } else {
      setSubmit(false);
    }

    setQ2((prev: any) => ({
      ...prev,
      [name]: value,
    }));
  };

  const SaveToDB = async () => {
    await fetch("/api/question", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: userId,
        phqa: phqa_data,
        q2: q2_data,
        location: location,
      }),
    }).then((res) =>
      res.json().then(() => {
        if (res.status === 200) {
          router.push("/liff/question/list");
        }
      })
    );
  };

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-10">
      <h1 className={title({ size: "xs" })}>
        {" "}
        แบบประเมินภาวะซึมเศร้าในวัยรุ่น{" "}
      </h1>
      <Progress
        aria-label="Loading..."
        className="max-w-md"
        showValueLabel={true}
        value={progress}
      />

      <div className="flex flex-col w-[90vw] min-h-[calc(100vh_-_350px)]">
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
            : q2.map((val, index) => {
                return (
                  <Tab key={index + 9}>
                    <div className="flex flex-col  gap-4 mt-[-50px]">
                      <div className="flex flex-col items-center">
                        {q2_Image(index)[index]}
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
                            onChange={(val) => q2Change(val)}
                          >
                            <Radio
                              className="inline-flex m-0  items-center justify-between flex-row-reverse max-w-full cursor-pointer rounded-xl p-3 border"
                              value="1"
                            >
                              ใช่
                            </Radio>
                            <Radio
                              className="inline-flex m-0  items-center justify-between flex-row-reverse max-w-full cursor-pointer rounded-xl p-3 border"
                              value="0"
                            >
                              ไม่ใช่
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
        variant="solid"
        onPress={() => router.back()}
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
    </section>
  );
}
