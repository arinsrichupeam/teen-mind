import { Image } from "@heroui/image";

import { title } from "@/components/primitives";

export default function Loading() {
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10 h-[calc(100vh)] bg-[url(/image/BG_TEEN_MIND_1.jpg)] bg-cover bg-center">
      <div className="flex flex-col text-center text-primary-500 items-center justify-center gap-8 ">
        <Image
          alt="app logo"
          className="h-[calc(7vh)]"
          loading="lazy"
          src="../image/logo_App.png"
        />
        <Image
          alt="loading"
          className="h-[calc(35vh)]"
          loading="lazy"
          src="../image/Loading.gif"
        />
        <h1 className={title({ size: "sm" })}>รอสักครู่นะทุกคน</h1>
      </div>
    </section>
  );
}
