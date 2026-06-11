"use client";

import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Image } from "@heroui/image";
import { Suspense, useState } from "react";

import Loading from "@/app/loading";

export default function QuestionPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState({
    lookup: false,
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

  const GotoLookup = async () => {
    setIsLoading((prev) => ({ ...prev, lookup: true }));
    try {
      await router.push("/liff/referent/lookup");
    } finally {
      setIsLoading((prev) => ({ ...prev, lookup: false }));
    }
  };

  return (
    <section className="flex flex-col w-screen min-h-[calc(100vh-48px)] px-8 items-center justify-center gap-4 bg-[url(/image/BG_TEEN_MIND_2.jpg)] bg-cover bg-center bg-no-repeat">
      <Suspense fallback={<Loading />}>
        <div className="flex flex-col items-center gap-5 pt-10 pb-6 w-full max-w-sm">
          <Image
            alt="app logo"
            className="h-[calc(7vh)]"
            loading="eager"
            src="/image/logo_App.png"
          />

          <Card className="w-full bg-white/95 shadow-lg backdrop-blur-sm border border-white/80">
            <CardBody className="flex flex-col items-center gap-4 py-6 px-5">
              <Button
                className="w-40"
                color="primary"
                isLoading={isLoading.lookup}
                onPress={GotoLookup}
              >
                เพิ่มแบบประเมิน
              </Button>
              <Button
                className="w-40"
                color="primary"
                isLoading={isLoading.list}
                onPress={GotoList}
              >
                แบบประเมินของฉัน
              </Button>
            </CardBody>
          </Card>
        </div>
      </Suspense>
    </section>
  );
}
