import { prisma } from "@sellly/database";
import { EmptyState, Input } from "@sellly/ui";
import { getPublishedStore } from "@/lib/store";
import { getActiveTemplate } from "@/lib/template";
import { ProductGrid } from "../_components/sections/product-grid";

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: { store: string };
  searchParams: { q?: string };
}) {
  const store = await getPublishedStore(params.store);
  const q = searchParams.q?.trim();

  const { template } = await getActiveTemplate(store.id);

  // With no query the page doubles as the "all products / all work" listing.
  const products = await prisma.product.findMany({
    where: {
      storeId: store.id,
      status: "ACTIVE",
      ...(q && {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { description: { contains: q, mode: "insensitive" as const } },
          { tags: { has: q.toLowerCase() } },
        ],
      }),
    },
    include: { images: { take: 1 } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
      <h1 className="mb-6 text-h1 text-primary">{q ? "Search" : template.labels.shop}</h1>
      <form action={`/${store.slug}/search`} className="mb-8">
        <Input name="q" defaultValue={q} placeholder={`Search ${template.category === "portfolio" ? "work" : "products"}…`} autoFocus />
      </form>

      {products.length === 0 ? (
        <EmptyState title={q ? "No results" : "Nothing here yet"} description={q ? `We couldn't find anything for "${q}".` : "Check back soon."} />
      ) : (
        <ProductGrid
          storeSlug={store.slug}
          card={template.card}
          viewLabel={template.labels.viewLabel}
          products={products.map((p) => ({
            id: p.id,
            slug: p.slug,
            name: p.name,
            price: Number(p.price),
            compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
            imageUrl: p.images[0]?.url,
          }))}
        />
      )}
    </div>
  );
}
