"use client";

import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Image } from "@heroui/image";
import { Suspense } from "react";

import Loading from "@/app/loading";

export default function QuestionPage() {
  const router = useRouter();

  const GotoList = () => {
    router.push("/liff/question/list");
  };

  return (
    <section className="flex flex-col w-screen min-h-[calc(100vh-48px)] px-8 items-center justify-center gap-4 bg-[url(/image/BG_TEEN_MIND_2.jpg)] bg-cover bg-center bg-no-repeat">
      <Suspense fallback={<Loading />}>
        <div className="flex flex-col items-center gap-5 pt-10 pb-10">
          <Image
            alt="app logo"
            className="h-[calc(7vh)]"
            loading="lazy"
            src="../image/Logo_App.png"
          />
          {/* <h1 className={title({ size: "xs" })}>
            คุณกำลังรู้สึกเศร้าอยู่หรือเปล่า?
          </h1>
          <h2 className={subtitle()}>
            สำรวจตัวเองว่าคุณกำลังเศร้ามากแค่ไหน โดยทำแบบสำรวจซึ่งใช้เวลาประมาณ
            4-5 นาที
          </h2>
          <Image alt="image" className="h-[40vh]" src="/image/Yallow.png" />
          <h2 className={subtitle()}>
            แบบทดสอบนี้อ้างอิงจากแบบประเมินภาวะซึมเศร้าในวัยรุ่น โดยกรมสุขภาพจิต
            กระทรวงสาธารณสุข
          </h2>*/}
          <Button className="w-full" color="primary" onPress={() => {}}>
            เพิ่มแบบทดสอบ
          </Button>
          <Button className="w-full" color="primary" onPress={() => GotoList()}>
            แบบทดสอบของฉัน
          </Button>
        </div>
      </Suspense>
    </section>
  );
}
