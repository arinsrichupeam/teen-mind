"use client";

import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { Questions_Master } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { subtitle, title } from "@/components/primitives";
import Loading from "@/app/loading";
import { formatThaiDate } from "@/utils/helper";

export default function QuestionListPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [questionList, setQuestionList] = useState<Questions_Master[]>([]);

  useEffect(() => {
    if (status !== "loading") {
      if (status === "authenticated") {
        const userId = session?.user?.id;

        fetch(`/api/profile/user/${userId}`).then((res) =>
          res.json().then((val) => {
            if (val.profile.length > 0 && val.profile[0].questions.length > 0) {
              setQuestionList(val.profile[0].questions);
            }
          })
        );
      }
    }
  }, [session]);

  return (
    <section className="flex flex-col px-8 py-10 w-[calc(100vw)] h-[calc(100vh-48px)] items-center justify-center gap-4 bg-[url(/image/BG_TEEN_MIND_2.jpg)] bg-cover bg-center bg-no-repeat">
      <Suspense fallback={<Loading />}>
        <h1 className={title({ size: "sm" })}>ผลประเมินภาวะซึมเศร้า</h1>
        <h2 className={subtitle()}>
          สำรวจตัวเองว่าคุณกำลังเศร้ามากแค่ไหน โดยทำแบบสำรวจซึ่งใช้เวลาประมาณ
          4-5 นาที
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
          className="w-full h-[calc(40vh)] p-3"
          offset={100}
          orientation="horizontal"
        >
          <div className="flex flex-col gap-5">
            {questionList.length === 0 ? (
              <p className="text-center text-gray-500">
                ยังไม่มีประวัติการทำแบบทดสอบ
              </p>
            ) : (
              questionList.map((val, index) => (
                <Card key={index}>
                  <CardBody className="text-sm">
                    <p>แบบทดสอบ ครั้งที่ {index + 1}</p>
                    <p>
                      วันที่{" "}
                      {formatThaiDate(val.createdAt)}
                    </p>
                    {val.result === "Green" ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full" />
                          <span className="text-green-700 font-semibold">
                            {val.result_text}
                          </span>
                        </div>
                      </div>
                    ) : val.result === "Green-Low" ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-400 rounded-full" />
                          <span className="text-green-600 font-semibold">
                            {val.result_text}
                          </span>
                        </div>
                      </div>
                    ) : val.result === "Yellow" ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                          <span className="text-yellow-700 font-semibold">
                            {val.result_text}
                          </span>
                        </div>
                      </div>
                    ) : val.result === "Orange" ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-orange-500 rounded-full" />
                          <span className="text-orange-700 font-semibold">
                            {val.result_text}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full" />
                          <span className="text-red-700 font-semibold">
                            {val.result_text}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardBody>
                </Card>
              ))
            )}
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
      </Suspense>
    </section>
  );
}
