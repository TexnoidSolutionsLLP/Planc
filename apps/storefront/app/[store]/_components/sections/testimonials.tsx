export function TestimonialsSection({ quote, author }: { quote?: string; author?: string }) {
  if (!quote) return null;
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 text-center md:py-24">
      <p className="sf-heading text-[clamp(24px,3.6vw,38px)] leading-snug text-primary">&ldquo;{quote}&rdquo;</p>
      {author && <p className="mt-5 text-small text-muted">— {author}</p>}
    </section>
  );
}
