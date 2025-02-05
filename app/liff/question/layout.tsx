export default function QuestionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="bg-[url(/image/BG_TEEN_MIND_2.jpg)] w-full bg-cover bg-center bg-no-repeat">
      <div className="inline-block max-w-lg text-center justify-center ">
        {children}
      </div>
    </section>
  );
}
