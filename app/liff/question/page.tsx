"use client";

import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Image } from "@heroui/image";

import { subtitle, title } from "@/components/primitives";

export default function QuestionPage() {
  const router = useRouter();

  const Submit = () => {
    router.push("/liff/question/phqa");
  };

  return (
    <section className="flex flex-col h-[calc(100vh-48px)] items-center justify-center gap-4 px-8 pt-10 bg-[url(/image/BG_TEEN_MIND_2.jpg)] bg-cover bg-center bg-no-repeat">
      <div className="flex flex-col items-center gap-5 pt-20">
        <h1 className={title({ size: "sm" })}>คุณกำลังเครียดอยู่หรือเปล่า?</h1>
        <h2 className={subtitle()}>
          สำรวจตัวเองว่าคุณกำลังเครียดมากแค่ไหน โดยใช้เวลาประมาณ 4-5 นาที
        </h2>
        <Image alt="image" height={400} src="/image/Q1-04.png" />
        <h2 className={subtitle()}>
          แบบทดสอบนี้อ้างอิงจากแบบประเมินความเครียด โดยกรมสุขภาพจิต
          กระทรวงสาธารณสุข
        </h2>
        <Button className="w-full" color="primary" onPress={() => Submit()}>
          เริ่มเลย
        </Button>
      </div>
    </section>
  );
}
