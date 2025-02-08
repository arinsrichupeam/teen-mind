"use client";

import { signIn } from "next-auth/react";
import { Button } from "@heroui/button";
import { Image } from "@heroui/image";
import { Suspense } from "react";

import { title } from "@/components/primitives";
import { LineIcon } from "@/components/icons";
import Loading from "@/app/loading";

export default function AuthPage() {
  return (
    <section className="flex flex-col w-[calc(100vw)] h-[calc(100vh-48px)] items-center gap-4 pt-10 px-8 py-8 md:py-10">
      <Suspense fallback={<Loading />}>
        <Image alt="BKK Logo" loading="lazy" src="/image/LogoBKK.png" />

        <div className=" flex flex-col text-center justify-center pt-[calc(10vh)] gap-20">
          <Image alt="BKK Logo" loading="lazy" src="/image/logo_App.png" />
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
