export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="bg-[url(/image/BG_TEEN_MIND_1.jpg)] w-full bg-cover bg-center bg-repeat">
      <div className="inline-block text-center justify-center ">{children}</div>
    </section>
  );
}
