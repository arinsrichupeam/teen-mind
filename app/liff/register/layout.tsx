export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="w-full bg-[url(/image/BG_TEEN_MIND_2.jpg)]  bg-cover bg-center bg-no-repeat">
      <div className="inline-block text-center justify-center">{children}</div>
    </section>
  );
}
