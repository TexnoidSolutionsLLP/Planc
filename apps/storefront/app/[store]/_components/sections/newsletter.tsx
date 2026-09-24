export function NewsletterSection({ title, body, cta }: { title?: string; body?: string; cta?: string }) {
  return (
    <section className="border-t border-border bg-secondary/50 py-16 md:py-20">
      <div className="mx-auto max-w-xl px-4 text-center">
        <h2 className="text-h2 text-primary">{title || "Stay in the loop"}</h2>
        <p className="mt-2 text-body text-muted">{body || "Get updates on new drops and offers."}</p>
        <form className="mx-auto mt-6 flex max-w-md flex-col gap-2 sm:flex-row">
          <input
            type="email"
            required
            aria-label="Email address"
            placeholder="you@example.com"
            className="h-12 flex-1 rounded border border-border bg-surface px-4 text-body text-primary placeholder:text-subtle focus-visible:border-accent focus-visible:outline-none"
          />
          <button type="submit" className="h-12 rounded bg-accent px-6 text-body font-semibold text-white transition-opacity duration-200 hover:opacity-90">
            {cta || "Subscribe"}
          </button>
        </form>
      </div>
    </section>
  );
}
