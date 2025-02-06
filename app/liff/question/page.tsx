"use client";

import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Image } from "@heroui/image";

import { subtitle, title } from "@/components/primitives";

export default function QuestionPage() {
  const router = useRouter();

  return (
    <section className="flex flex-col w-[calc(100vw)] h-[calc(100vh-48px)] items-center gap-4 px-8 pt-10 bg-[url(/image/BG_TEEN_MIND_2.jpg)]  bg-cover bg-center bg-no-repeat">
      <div className="flex flex-col items-center gap-5 pt-20">
        <h1 className={title({ size: "sm" })}>คุณกำลังเคลียดอยู่หรือเปล่า?</h1>
        <h2 className={subtitle()}>
          สำรวจตัวเองว่าคุณกำลังเคลียดมากแค่ไหน โดยใช้เวลาประมาณ 4-5 นาที
        </h2>
        <Image alt="image" height={400} src="/image/04.png" />
        <h2 className={subtitle()}>
          แบบทดสอบนี้อ้างอิงจากแบบประเมินความเคลียด โดยกรมสุขภาพจิต
          กระทรวงสาธารณสุข
        </h2>
        <Button
          className="w-full"
          color="primary"
          onPress={() => router.push("/liff/question/phqa")}
        >
          เริ่มเลย
        </Button>
      </div>
    </section>
  );

  //   useEffect(() => {
  //     // router.push("/question/phqa");
  //   }, []);
}
