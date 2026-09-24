export function FaqSection({ body }: { body?: string }) {
  if (!body) return null;
  const items = body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [q, ...rest] = line.split("|");
      return { question: q?.trim(), answer: rest.join("|").trim() };
    })
    .filter((item) => item.question && item.answer);

  if (items.length === 0) return null;

  return (
    <section className="mx-auto max-w-2xl px-4 py-12">
      <h2 className="mb-6 text-h2 text-primary">FAQ</h2>
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.question} className="border-b border-border pb-4">
            <p className="font-medium text-primary">{item.question}</p>
            <p className="mt-1 text-small text-muted">{item.answer}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
