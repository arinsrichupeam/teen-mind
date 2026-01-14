"use client";

import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Image } from "@heroui/image";
import { Suspense, useState } from "react";

import Loading from "@/app/loading";

export default function QuestionPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState({
    privacy: false,
    list: false,
  });

  const GotoList = async () => {
    setIsLoading((prev) => ({ ...prev, list: true }));
    try {
      await router.push("/liff/question/list");
    } finally {
      setIsLoading((prev) => ({ ...prev, list: false }));
    }
  };

  const GotoPrivacy = async () => {
    setIsLoading((prev) => ({ ...prev, privacy: true }));
    try {
      await router.push("/liff/privacy");
    } finally {
      setIsLoading((prev) => ({ ...prev, privacy: false }));
    }
  };

  return (
    <section className="flex flex-col w-screen min-h-[calc(100vh-48px)] px-8 items-center justify-center gap-4 bg-[url(/image/BG_TEEN_MIND_2.jpg)] bg-cover bg-center bg-no-repeat">
      <Suspense fallback={<Loading />}>
        <div className="flex flex-col items-center gap-5 pt-10 pb-0">
          <Image
            alt="app logo"
            className="h-[calc(5vh)]"
            loading="lazy"
            src="../image/Logo_App.png"
          />
          <Button
            className="w-40"
            color="primary"
            isLoading={isLoading.privacy}
            onPress={GotoPrivacy}
          >
            เพิ่มแบบทดสอบ
          </Button>
          <Button
            className="w-40"
            color="primary"
            isLoading={isLoading.list}
            onPress={GotoList}
          >
            แบบทดสอบของฉัน
          </Button>
        </div>
      </Suspense>
    </section>
  );
}
