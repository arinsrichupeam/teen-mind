"use client";

import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { Questions_Master } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import moment from "moment";

import { subtitle, title } from "@/components/primitives";

export default function QuestionListPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [questionList, setQuestionList] = useState<Questions_Master[]>([]);

  useEffect(() => {
    if (status !== "loading" && status === "authenticated") {
      const userId = session?.user?.id;

      fetch(`/api/question/${userId}`).then((res) =>
        res.json().then((val) => {
          setQuestionList(val);
        })
      );
    }
  }, [session]);

  return (
    <section className="flex flex-col px-8 w-[calc(100vw)] h-[calc(100vh-48px)] items-center justify-center gap-4 bg-[url(/image/BG_TEEN_MIND_2.jpg)]  bg-cover bg-center bg-no-repeat">
      <h1 className={title({ size: "sm" })}>ผลประเมินภาวะซึมเศร้า</h1>
      <h2 className={subtitle()}>
        สำรวจตัวเองว่าคุณกำลังเคลียดมากแค่ไหน โดยทำแบบสำรวจซึ่งใช้เวลาประมาณ 4-5
        นาที
      </h2>
      <Button
        className="w-full"
        color="primary"
        radius="full"
        size="lg"
        variant="solid"
        onPress={() => router.push("/liff/question")}
      >
        ทำแบบสำรวจ
      </Button>
      <h2 className={title({ size: "xs" })}>ประวัติการทำรายการ</h2>
      <ScrollShadow
        className="w-full h-[350px] p-3"
        offset={100}
        orientation="horizontal"
      >
        <div className="flex flex-col gap-5">
          {questionList.map((val, index) => {
            return (
              <Card key={index}>
                <CardBody>
                  <p>แบบทดสอบ ครั้งที่ {index + 1}</p>
                  <p>
                    วันที่{" "}
                    {moment(val.createdAt.toString())
                      .add(543, "year")
                      .locale("th")
                      .format("DD MMM yyyy")}
                  </p>
                  {val.result == "Green" ? (
                    <p>ไม่พบความเสี่ยง</p>
                  ) : val.result == "Yellow" ? (
                    <p>พบความเสี่ยงระดับปานกลาง</p>
                  ) : (
                    <p>พบอาการซึมเศร้าระดับรุนแรง</p>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      </ScrollShadow>
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
    </section>
  );
}
