export default function QuestionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="w-full">
      <div className="inline-block text-center justify-center ">{children}</div>
    </section>
  );
}
