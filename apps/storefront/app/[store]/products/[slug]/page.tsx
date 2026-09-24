import { notFound } from "next/navigation";
import { prisma } from "@sellly/database";
import { trackEvent } from "@sellly/analytics";
import { getPublishedStore } from "@/lib/store";
import { getActiveTemplate } from "@/lib/template";
import { ProductGrid } from "../../_components/sections/product-grid";
import { AddToCartForm } from "./_components/add-to-cart-form";

export default async function ProductPage({ params }: { params: { store: string; slug: string } }) {
  const store = await getPublishedStore(params.store);
  const product = await prisma.product.findFirst({
    where: { storeId: store.id, slug: params.slug, status: "ACTIVE" },
    include: { images: { orderBy: { position: "asc" } }, variants: true, options: true },
  });
  if (!product) notFound();
  await trackEvent(store.id, "page_view", { page: "product", productId: product.id });

  const { template } = await getActiveTemplate(store.id);
  const portfolio = template.category === "portfolio";

  const related = await prisma.product.findMany({
    where: { storeId: store.id, status: "ACTIVE", id: { not: product.id } },
    include: { images: { take: 1 } },
    take: 4,
  });

  const price = Number(product.price);
  const compareAtPrice = product.compareAtPrice ? Number(product.compareAtPrice) : null;
  const discount = compareAtPrice && compareAtPrice > price ? Math.round(100 - (price / compareAtPrice) * 100) : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <div className="space-y-3">
          <div className="aspect-square overflow-hidden rounded-md bg-secondary">
            {product.images[0] && <img src={product.images[0].url} alt={product.name} className="h-full w-full object-cover" />}
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.slice(1).map((img) => (
                <div key={img.id} className="aspect-square overflow-hidden rounded-sm bg-secondary">
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="text-h1 text-primary">{product.name}</h1>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-h3 text-primary">₹{price.toLocaleString("en-IN")}</span>
            {compareAtPrice && compareAtPrice > price && (
              <span className="text-body text-muted line-through">₹{compareAtPrice.toLocaleString("en-IN")}</span>
            )}
            {discount && <span className="text-small font-medium text-success">{discount}% off</span>}
          </div>

          {product.description && <p className="mt-4 text-body text-muted">{product.description}</p>}

          <div className="mt-6">
            <AddToCartForm
              productId={product.id}
              name={product.name}
              price={price}
              imageUrl={product.images[0]?.url}
              inventoryQty={product.inventoryQty}
              options={product.options.map((o) => ({ name: o.name, values: o.values }))}
            />
          </div>

          {!portfolio && (
            <div className="mt-8 space-y-3 border-t border-border pt-6 text-small text-muted">
              <p><span className="font-medium text-primary">Shipping:</span> Dispatched within 2–3 business days.</p>
              <p><span className="font-medium text-primary">Returns:</span> 7-day easy returns on unused items.</p>
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-h2 text-primary">{portfolio ? "More work" : "You may also like"}</h2>
          <ProductGrid
            storeSlug={store.slug}
            card={{ ...template.card, layout: "grid", columns: 4, style: template.card.style === "list" ? "plain" : template.card.style }}
            viewLabel={template.labels.viewLabel}
            products={related.map((p) => ({
              id: p.id,
              slug: p.slug,
              name: p.name,
              price: Number(p.price),
              compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
              imageUrl: p.images[0]?.url,
            }))}
          />
        </section>
      )}
    </div>
  );
}
