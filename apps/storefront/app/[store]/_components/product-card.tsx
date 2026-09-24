import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { CardAspect, CardConfig } from "@sellly/theme";

export interface ProductCardProps {
  storeSlug: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice?: number | null;
  imageUrl?: string;
  card?: CardConfig;
  viewLabel?: string;
  index?: number;
}

const DEFAULT_CARD: CardConfig = { style: "plain", aspect: "square", columns: 4, layout: "grid", showPrice: true };

const ASPECT: Record<CardAspect, string> = {
  square: "aspect-square",
  portrait: "aspect-[4/5]",
  landscape: "aspect-[4/3]",
};
// Staggered heights so masonry columns don't look like a grid.
const MASONRY_ASPECTS = ["aspect-[4/5]", "aspect-square", "aspect-[3/4]", "aspect-[4/3]", "aspect-[4/5]", "aspect-[5/6]"];

export function ProductCard({
  storeSlug,
  slug,
  name,
  price,
  compareAtPrice,
  imageUrl,
  card = DEFAULT_CARD,
  viewLabel = "View",
  index = 0,
}: ProductCardProps) {
  const href = `/${storeSlug}/products/${slug}`;
  const onSale = !!compareAtPrice && compareAtPrice > price;
  const discount = onSale ? Math.round(100 - (price / compareAtPrice!) * 100) : null;
  const aspect = card.layout === "masonry" ? MASONRY_ASPECTS[index % MASONRY_ASPECTS.length] : ASPECT[card.aspect];
  const imgClass = "h-full w-full object-cover transition-transform duration-500 ease-premium group-hover:scale-[1.04]";
  const saleBadge = card.showPrice && onSale && (
    <span className="absolute left-2 top-2 rounded-sm bg-accent px-2 py-0.5 text-[11px] font-semibold text-white">Sale</span>
  );

  const priceRow = card.showPrice ? (
    <div className="flex flex-wrap items-center gap-x-2">
      <p className="text-small text-primary">₹{price.toLocaleString("en-IN")}</p>
      {onSale && <p className="text-caption text-muted line-through">₹{compareAtPrice!.toLocaleString("en-IN")}</p>}
      {discount && <p className="text-caption font-medium text-success">{discount}% off</p>}
    </div>
  ) : (
    <p className="inline-flex items-center gap-1 text-small text-muted transition-colors group-hover:text-accent">
      {viewLabel} <ArrowUpRight className="h-3.5 w-3.5" />
    </p>
  );

  if (card.style === "list") {
    return (
      <Link
        href={href}
        className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-border py-5 transition-colors hover:bg-secondary/40 sm:gap-8 sm:px-2"
      >
        <span className="w-8 text-small tabular text-subtle sm:w-12">{String(index + 1).padStart(2, "0")}</span>
        <span className="sf-heading truncate text-[clamp(20px,3.2vw,36px)] leading-tight text-primary transition-transform duration-300 ease-premium group-hover:translate-x-1">
          {name}
        </span>
        <span className="flex items-center gap-4">
          <span className="hidden h-14 w-20 overflow-hidden rounded-sm bg-secondary md:block">
            {imageUrl && <img src={imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />}
          </span>
          {card.showPrice ? (
            <span className="text-small text-muted">₹{price.toLocaleString("en-IN")}</span>
          ) : (
            <ArrowUpRight className="h-5 w-5 text-muted transition-colors group-hover:text-accent" />
          )}
        </span>
      </Link>
    );
  }

  if (card.style === "overlay") {
    return (
      <Link href={href} className="group block">
        <div className={`relative overflow-hidden rounded-md bg-secondary ${aspect}`}>
          {imageUrl && <img src={imageUrl} alt={name} loading="lazy" className={imgClass} />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" aria-hidden="true" />
          <div className="absolute inset-x-0 bottom-0 p-4 text-white">
            <p className="text-small font-medium">{name}</p>
            <p className="mt-0.5 text-caption text-white/80">{card.showPrice ? `₹${price.toLocaleString("en-IN")}` : viewLabel}</p>
          </div>
        </div>
      </Link>
    );
  }

  if (card.style === "boxed") {
    return (
      <Link
        href={href}
        className="group block overflow-hidden rounded-md border border-border bg-surface transition-[box-shadow,transform] duration-300 ease-premium hover:-translate-y-0.5 hover:shadow-md"
      >
        <div className={`relative overflow-hidden bg-secondary ${aspect}`}>
          {imageUrl && <img src={imageUrl} alt={name} loading="lazy" className={imgClass} />}
          {saleBadge}
        </div>
        <div className="space-y-0.5 p-3.5">
          <p className="truncate text-small font-medium text-primary">{name}</p>
          {priceRow}
        </div>
      </Link>
    );
  }

  return (
    <Link href={href} className="group block">
      <div className={`relative overflow-hidden rounded-md bg-secondary ${aspect}`}>
        {imageUrl && <img src={imageUrl} alt={name} loading="lazy" className={imgClass} />}
        {saleBadge}
      </div>
      <div className="mt-3 space-y-0.5">
        <p className="text-small font-medium text-primary">{name}</p>
        {priceRow}
      </div>
    </Link>
  );
}
