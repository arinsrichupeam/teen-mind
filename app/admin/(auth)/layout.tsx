import { Divider, Image, Link } from "@heroui/react";
import { ReactNode } from "react";

import { siteConfig } from "@/config/site";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen">
      <div className="flex relative h-[calc(100%-48px)]">
        <div className="flex-1 flex-col flex items-center justify-center p-6">
          <div className="md:hidden absolute left-0 right-0 bottom-0 top-0 z-0">
            <Image
              alt="gradient"
              className="w-full h-full"
              src="../../../image/docs-right.png"
            />
          </div>
          {children}
        </div>

        <div className="hidden my-10 md:block">
          <Divider orientation="vertical" />
        </div>

        <div className="hidden md:flex flex-1 relative flex items-center justify-center p-6">
          <div className="absolute left-0 right-0 bottom-0 top-0 z-0">
            <Image
              alt="gradient"
              className="w-full h-full"
              src="../../../image/docs-right.png"
            />
          </div>

          <div className="z-10">
            <Image alt="logo" height={70} src="../../../image/Logo_App.png" />
            <div className="font-light text-slate-400 mt-4">
              {siteConfig.description}{" "}
            </div>
          </div>
        </div>
      </div>
      <footer className="w-full max-h-[48px] text-xs flex items-center justify-center py-3">
        <Link
          isExternal
          className="flex items-center gap-1 text-sm"
          href={siteConfig.links.rpp}
          title="heroui.com homepage"
        >
          <span className="text-default-600">Powered by</span>
          <p className="text-primary">โรงพยาบาลราชพิพัฒน์ (ฝ่ายวิชาการ)</p>
        </Link>
      </footer>
    </div>
  );
}
