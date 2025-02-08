import { Link } from "@heroui/link";

import { siteConfig } from "@/config/site";

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col h-screen ">
      {/* <Navbar /> */}
      <main className="container mx-auto flex-grow">
        <section className="flex flex-col items-center justify-center gap-4">
          <div className="inline-block text-center justify-center">
            {children}
          </div>
        </section>
      </main>
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
