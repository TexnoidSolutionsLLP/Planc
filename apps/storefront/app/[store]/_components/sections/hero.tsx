import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { HeroVariant } from "@sellly/theme";

interface HeroProps {
  storeSlug: string;
  storeName: string;
  description?: string | null;
  title?: string;
  ctaLabel?: string;
  variant: HeroVariant;
  imageUrl?: string;
  eyebrow?: string;
}

const btn =
  "inline-flex h-12 items-center gap-2 rounded bg-accent px-7 text-body font-semibold text-white transition-[opacity,transform] duration-200 hover:opacity-90 active:scale-[0.98]";

export function HeroSection({ storeSlug, storeName, description, title, ctaLabel, variant, imageUrl, eyebrow }: HeroProps) {
  const heading = title || storeName;
  const href = `/${storeSlug}/search`;
  const cta = ctaLabel || "Shop now";

  if (variant === "split") {
    return (
      <section className="bg-secondary/60">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2 md:py-24">
          <div className="order-2 md:order-1">
            {eyebrow && <p className="mb-4 text-caption font-semibold uppercase tracking-[0.2em] text-accent">{eyebrow}</p>}
            <h1 className="text-h1 text-primary md:text-display">{heading}</h1>
            {description && <p className="mt-5 max-w-md text-body-lg text-muted">{description}</p>}
            <Link href={href} className={`${btn} mt-8`}>
              {cta} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="order-1 md:order-2">
            <div className="aspect-[4/3] overflow-hidden rounded-lg bg-secondary md:aspect-[4/5]">
              {imageUrl && <img src={imageUrl} alt="" className="h-full w-full object-cover" />}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (variant === "fullbleed") {
    return (
      <section className={`relative isolate overflow-hidden ${imageUrl ? "text-white" : "bg-primary text-background"}`}>
        {imageUrl && (
          <>
            <img src={imageUrl} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/70 via-black/35 to-black/20" aria-hidden="true" />
          </>
        )}
        <div className="mx-auto flex min-h-[70vh] max-w-6xl flex-col items-center justify-end px-4 pb-16 pt-28 text-center md:min-h-[82vh] md:pb-24">
          {eyebrow && <p className="mb-4 text-caption font-semibold uppercase tracking-[0.25em] opacity-80">{eyebrow}</p>}
          <h1 className="max-w-4xl text-[clamp(40px,8vw,96px)] leading-[1]">{heading}</h1>
          {description && <p className="mt-5 max-w-lg text-body-lg opacity-85">{description}</p>}
          <Link href={href} className={`${btn} mt-8`}>
            {cta} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    );
  }

  if (variant === "statement") {
    return (
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-28">
          {eyebrow && <p className="mb-6 text-caption font-semibold uppercase tracking-[0.2em] text-accent">{eyebrow}</p>}
          <h1 className="max-w-5xl text-[clamp(44px,9vw,116px)] leading-[0.95] text-primary">{heading}</h1>
          <div className="mt-10 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            {description ? <p className="max-w-md text-body-lg text-muted">{description}</p> : <span />}
            <Link href={href} className={`${btn} self-start`}>
              {cta} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (variant === "index") {
    return (
      <section>
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-16 md:pb-16 md:pt-28">
          <p className="mb-6 inline-flex items-center gap-2 text-small text-muted">
            <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
            {eyebrow || "Portfolio"}
          </p>
          <h1 className="max-w-4xl text-[clamp(40px,8vw,104px)] leading-[0.98] text-primary">{heading}</h1>
          {description && <p className="mt-6 max-w-xl text-body-lg text-muted">{description}</p>}
          <Link href={href} className="mt-8 inline-flex items-center gap-2 border-b border-primary pb-1 text-body font-medium text-primary transition-colors hover:border-accent hover:text-accent">
            {cta} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-secondary/50">
      <div className="mx-auto max-w-6xl px-4 py-16 text-center md:py-28">
        {eyebrow && <p className="mb-4 text-caption font-semibold uppercase tracking-[0.2em] text-accent">{eyebrow}</p>}
        <h1 className="mx-auto max-w-3xl text-h1 text-primary md:text-display">{heading}</h1>
        {description && <p className="mx-auto mt-5 max-w-xl text-body-lg text-muted">{description}</p>}
        <Link href={href} className={`${btn} mt-8`}>
          {cta}
        </Link>
      </div>
    </section>
  );
}
