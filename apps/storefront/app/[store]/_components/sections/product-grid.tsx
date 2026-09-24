import { EmptyState } from "@sellly/ui";
import type { CardConfig } from "@sellly/theme";
import { ProductCard } from "../product-card";

export interface ProductGridProduct {
  id: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  imageUrl?: string;
}

const COLUMNS: Record<CardConfig["columns"], { grid: string; masonry: string }> = {
  2: { grid: "grid-cols-1 sm:grid-cols-2", masonry: "columns-1 sm:columns-2" },
  3: { grid: "grid-cols-2 lg:grid-cols-3", masonry: "columns-2 lg:columns-3" },
  4: { grid: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4", masonry: "columns-2 md:columns-3 lg:columns-4" },
};

/** Lays out product cards according to the active template (grid, masonry or indexed list). */
export function ProductGrid({
  storeSlug,
  products,
  card,
  viewLabel,
}: {
  storeSlug: string;
  products: ProductGridProduct[];
  card: CardConfig;
  viewLabel?: string;
}) {
  const cards = products.map((p, i) => (
    <ProductCard
      key={p.id}
      storeSlug={storeSlug}
      slug={p.slug}
      name={p.name}
      price={p.price}
      compareAtPrice={p.compareAtPrice}
      imageUrl={p.imageUrl}
      card={card}
      viewLabel={viewLabel}
      index={i}
    />
  ));

  if (card.style === "list") return <div className="border-t border-border">{cards}</div>;

  if (card.layout === "masonry") {
    return (
      <div className={`${COLUMNS[card.columns].masonry} gap-4 md:gap-5`}>
        {cards.map((c, i) => (
          <div key={products[i].id} className="mb-4 break-inside-avoid md:mb-5">
            {c}
          </div>
        ))}
      </div>
    );
  }

  return <div className={`grid gap-x-4 gap-y-8 md:gap-x-5 ${COLUMNS[card.columns].grid}`}>{cards}</div>;
}

export function ProductGridSection({
  storeSlug,
  title,
  products,
  card,
  viewLabel,
}: {
  storeSlug: string;
  title?: string;
  products: ProductGridProduct[];
  card: CardConfig;
  viewLabel?: string;
}) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14 md:py-20">
      {title && <h2 className="mb-8 text-h2 text-primary md:mb-10">{title}</h2>}
      {products.length === 0 ? (
        <EmptyState title="Nothing here yet" description="This store is still setting up. Check back soon." />
      ) : (
        <ProductGrid storeSlug={storeSlug} products={products} card={card} viewLabel={viewLabel} />
      )}
    </section>
  );
}
