export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="w-full min-h-full bg-[url(/image/BG_TEEN_MIND_2.jpg)] bg-cover bg-center bg-no-repeat">
      <div className="w-full flex justify-center">{children}</div>
    </section>
  );
}
