"use client";

import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { Case, ScreeningResult } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { subtitle, title } from "@/components/primitives";
import Loading from "@/app/loading";
import { mapScreeningResultToLegacyColor } from "@/lib/legacy-value-mapping";
import { formatThaiDate } from "@/utils/helper";

const RESULT_LABEL: Record<string, string> = {
  Green: "ปกติ",
  "Green-Low": "เสี่ยงต่ำ",
  Yellow: "เสี่ยงปานกลาง",
  Orange: "เสี่ยงสูง",
  Red: "เสี่ยงสูงมาก",
};

function resultDisplay(result: ScreeningResult) {
  const color = mapScreeningResultToLegacyColor(result) || "Red";

  return {
    color,
    label: RESULT_LABEL[color] ?? color,
  };
}

export default function QuestionListPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [questionList, setQuestionList] = useState<Case[]>([]);

  useEffect(() => {
    if (status !== "loading") {
      if (status === "authenticated") {
        const userId = session?.user?.id;

        fetch(`/api/profile/user/${userId}`).then((res) =>
          res.json().then((val) => {
            const cases =
              val.profile?.[0]?.questions ??
              val.profile?.[0]?.cases ??
              val.questions ??
              [];

            if (Array.isArray(cases) && cases.length > 0) {
              setQuestionList(cases);
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
          สำรวจตัวเองว่าคุณกำลังเศร้ามากแค่ไหน โดยทำแบบประเมินซึ่งใช้เวลาประมาณ
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
          ทำแบบประเมิน
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
              questionList.map((val, index) => {
                const { color, label } = resultDisplay(val.result);
                const dotClass =
                  color === "Green"
                    ? "bg-green-500"
                    : color === "Green-Low"
                      ? "bg-green-400"
                      : color === "Yellow"
                        ? "bg-yellow-500"
                        : color === "Orange"
                          ? "bg-orange-500"
                          : "bg-red-500";
                const textClass =
                  color === "Green"
                    ? "text-green-700"
                    : color === "Green-Low"
                      ? "text-green-600"
                      : color === "Yellow"
                        ? "text-yellow-700"
                        : color === "Orange"
                          ? "text-orange-700"
                          : "text-red-700";

                return (
                  <Card key={index}>
                    <CardBody className="text-sm">
                      <p>แบบทดสอบ ครั้งที่ {index + 1}</p>
                      <p>วันที่ {formatThaiDate(val.createdAt)}</p>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 ${dotClass} rounded-full`} />
                          <span className={`${textClass} font-semibold`}>
                            {label}
                          </span>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                );
              })
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
