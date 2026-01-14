import { Link } from "@heroui/link";

import ProfileAvatar from "./components/ProfileAvatar";

import { siteConfig } from "@/config/site";

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col min-h-screen w-full overflow-x-hidden">
      <header className="absolute top-0 left-0 right-0 w-full flex justify-end px-4 py-3 !bg-transparent z-10">
        <ProfileAvatar />
      </header>
      <main className="w-full flex-grow">{children}</main>
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
