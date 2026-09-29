"use client";

import { signIn } from "next-auth/react";
import { Button } from "@heroui/button";
import { Image } from "@heroui/image";
import { Suspense } from "react";

import { LiffPageBg } from "@/components/liff-page-bg";
import { title } from "@/components/primitives";
import { LineIcon } from "@/components/icons";
import Loading from "@/app/loading";

export default function AuthPage() {
  return (
    <section className="relative isolate flex flex-col w-[calc(100vw)] min-h-screen items-center gap-4 pt-10 px-8 py-8 pb-14 md:py-10 overflow-hidden">
      <LiffPageBg />
      <Suspense fallback={<Loading />}>
        <Image
          alt="BKK Logo"
          className="max-h-[calc(10vh)]"
          loading="eager"
          src="/image/Logo_BKK.png"
        />

        <div className=" flex flex-col text-center justify-center pt-[calc(10vh)] gap-20">
          <Image
            alt="BKK Logo"
            className="h-[calc(7vh)]"
            loading="eager"
            src="/image/bkk-mind-logo.png"
          />
          <p className={title({ size: "sm" })}>เข้าสู่ระบบ</p>
        </div>

        <div className="flex gap-3">
          <Button
            isIconOnly
            aria-label="Line"
            className="w-14 h-14"
            color="warning"
            variant="faded"
            onPress={() => signIn("line")}
          >
            <LineIcon />
          </Button>
        </div>
      </Suspense>
    </section>
  );
}
