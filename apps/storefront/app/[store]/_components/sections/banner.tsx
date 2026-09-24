export function BannerSection({ text, ctaLabel }: { text?: string; ctaLabel?: string }) {
  if (!text) return null;
  return (
    <section className="bg-primary px-4 py-14 text-center text-background md:py-20">
      <p className="mx-auto max-w-3xl text-h2">{text}</p>
      {ctaLabel && <p className="mt-3 text-small opacity-80">{ctaLabel}</p>}
    </section>
  );
}
