import { Image } from "@heroui/image";

import { LiffPageBg } from "@/components/liff-page-bg";
import { title } from "@/components/primitives";

export default function Loading() {
  return (
    <section className="relative isolate flex flex-col items-center justify-center gap-4 py-8 md:py-10 h-[calc(100vh)] overflow-hidden">
      <LiffPageBg />
      <div className="relative flex flex-col text-center text-primary-500 items-center justify-center gap-8 ">
        <Image
          alt="app logo"
          className="h-[calc(7vh)]"
          loading="eager"
          src="/image/logo_App.png"
        />
        <Image
          alt="loading"
          className="h-[calc(35vh)]"
          loading="eager"
          src="/image/Loading.gif"
        />
        <h1 className={title({ size: "sm" })}>รอสักครู่นะทุกคน</h1>
      </div>
    </section>
  );
}
