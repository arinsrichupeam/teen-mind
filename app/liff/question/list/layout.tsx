export default function QuestionListLayout({
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
