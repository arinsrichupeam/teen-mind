export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col h-full px-8 pt-20">
      <div className="inline-block max-w-lg text-center justify-center ">
        {children}
      </div>
    </section>
  );
}
