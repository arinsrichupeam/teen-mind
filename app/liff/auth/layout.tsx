export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col h-full items-center justify-center bg-[url(/image/wallpaper.png)] bg-cover">
      <div className="inline-block max-w-lg text-center justify-center ">
        {children}
      </div>
    </section>
  );
}
