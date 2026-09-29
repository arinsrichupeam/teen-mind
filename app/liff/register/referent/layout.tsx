import { LiffPageBg } from "@/components/liff-page-bg";

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="relative isolate w-full min-h-screen overflow-hidden">
      <LiffPageBg blur />
      <div className="relative w-full flex justify-center">{children}</div>
    </section>
  );
}
