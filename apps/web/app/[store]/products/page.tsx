import { prisma } from "@sellly/database";
import { ProductsView } from "./products-view";
import { requireStore } from "@/lib/session";
import { LOW_STOCK_THRESHOLD, SOLD_ORDER_STATUSES } from "@/lib/product-metrics";

export default async function ProductsPage({ params, searchParams }: { params: { store: string }; searchParams: { status?: string; q?: string } }) {
  const { store } = await requireStore(params.store);

  const filter = searchParams.status;
  const q = searchParams.q?.trim();
  const products = await prisma.product.findMany({
    where: {
      storeId: store.id,
      ...(q && { name: { contains: q, mode: "insensitive" as const } }),
      ...(filter === "active" && { status: "ACTIVE" }),
      ...(filter === "draft" && { status: "DRAFT" }),
      ...(filter === "archived" && { status: "ARCHIVED" }),
      ...(filter === "out-of-stock" && { inventoryQty: 0 }),
      ...(filter === "low-stock" && {
        trackInventory: true,
        inventoryQty: { gt: 0, lte: LOW_STOCK_THRESHOLD },
      }),
    },
    include: { images: { take: 1, orderBy: { position: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  const sold = products.length
    ? await prisma.orderItem.groupBy({
        by: ["productId"],
        where: {
          productId: { in: products.map((p) => p.id) },
          order: {
            storeId: store.id,
            status: { in: [...SOLD_ORDER_STATUSES] },
          },
        },
        _sum: { quantity: true },
      })
    : [];
  const unitsSold = new Map(sold.map((row) => [row.productId, row._sum.quantity ?? 0]));
  const lowStockCount = await prisma.product.count({
    where: {
      storeId: store.id,
      status: { not: "ARCHIVED" },
      trackInventory: true,
      inventoryQty: { gt: 0, lte: LOW_STOCK_THRESHOLD },
    },
  });

  return (
    <ProductsView
      store={{ slug: store.slug }}
      products={products.map((p) => ({
        ...p,
        price: Number(p.price),
        cost: p.cost != null ? Number(p.cost) : null,
      }))}
      unitsSold={unitsSold}
      lowStockCount={lowStockCount}
      filter={filter}
      q={q}
    />
  );
}
