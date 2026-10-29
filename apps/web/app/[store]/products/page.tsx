import Image from "next/image";
import Link from "next/link";
import { prisma } from "@sellly/database";
import { Badge, buttonVariants, EmptyState, Table, Thead, Th, Tr, Td } from "@sellly/ui";
import { requireStore } from "@/lib/session";
import { LOW_STOCK_THRESHOLD, SOLD_ORDER_STATUSES, stockState, unitEconomics } from "@/lib/product-metrics";

const STATUS_VARIANT = { DRAFT: "default", ACTIVE: "success", ARCHIVED: "default" } as const;

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: { store: string };
  searchParams: { status?: string; q?: string };
}) {
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
      ...(filter === "low-stock" && { trackInventory: true, inventoryQty: { gt: 0, lte: LOW_STOCK_THRESHOLD } }),
    },
    include: { images: { take: 1, orderBy: { position: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  const sold = products.length
    ? await prisma.orderItem.groupBy({
        by: ["productId"],
        where: { productId: { in: products.map((p) => p.id) }, order: { storeId: store.id, status: { in: [...SOLD_ORDER_STATUSES] } } },
        _sum: { quantity: true },
      })
    : [];
  const unitsSold = new Map(sold.map((row) => [row.productId, row._sum.quantity ?? 0]));
  const lowStockCount = await prisma.product.count({
    where: { storeId: store.id, status: { not: "ARCHIVED" }, trackInventory: true, inventoryQty: { gt: 0, lte: LOW_STOCK_THRESHOLD } },
  });

  const filters = [
    { key: undefined, label: "All" },
    { key: "active", label: "Active" },
    { key: "draft", label: "Draft" },
    { key: "low-stock", label: "Low stock" },
    { key: "out-of-stock", label: "Out of stock" },
    { key: "archived", label: "Archived" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-title text-primary">Products</h1>
          <p className="text-body text-muted">Manage what you sell.</p>
        </div>
        <Link href={`/${store.slug}/products/new`} className={buttonVariants({})}>
          Add product
        </Link>
      </div>

      {lowStockCount > 0 && filter !== "low-stock" && (
        <Link href="?status=low-stock" className="block rounded-lg border border-warning/30 bg-warning-soft px-4 py-3 text-small text-primary">
          {lowStockCount} product{lowStockCount === 1 ? " is" : "s are"} running low (≤ {LOW_STOCK_THRESHOLD} left). <span className="font-medium underline">Review</span>
        </Link>
      )}

      <div className="flex gap-1 overflow-x-auto border-b border-border" role="tablist" aria-label="Filter products">
        {filters.map((f) => (
          <Link
            key={f.label}
            href={f.key ? `?status=${f.key}` : "?"}
            className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-[14px] transition-colors duration-150 ${
              filter === f.key ? "border-brand font-medium text-primary" : "border-transparent text-muted hover:text-primary"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        <EmptyState
          title={q ? `No results for “${q}”` : "No products yet"}
          description={q ? "Try a different name, or clear the search." : "Add your first product to start building your store."}
          action={
            <Link href={`/${store.slug}/products/new`} className={buttonVariants({})}>
              Add product
            </Link>
          }
        />
      ) : (
        <Table>
          <Thead>
            <Tr>
              <Th>Product</Th>
              <Th>Status</Th>
              <Th>Inventory</Th>
              <Th>Price</Th>
              <Th>Cost</Th>
              <Th title="Per unit at list price, before discounts, shipping, payment fees and refunds">Est. margin</Th>
              <Th title="From confirmed, non-cancelled orders">Units sold</Th>
            </Tr>
          </Thead>
          <tbody>
            {products.map((p) => (
              <Tr key={p.id}>
                <Td>
                  <Link href={`/${store.slug}/products/${p.id}`} className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-sm bg-secondary">
                      {p.images[0] && (
                        <Image src={p.images[0].url} alt="" width={40} height={40} className="h-full w-full object-cover" />
                      )}
                    </div>
                    <span className="font-medium text-primary hover:underline">{p.name}</span>
                  </Link>
                </Td>
                <Td>
                  <Badge variant={STATUS_VARIANT[p.status]}>{p.status}</Badge>
                </Td>
                <Td>
                  {(() => {
                    const state = stockState(p);
                    if (state === "untracked") return <span className="text-muted">Not tracked</span>;
                    if (state === "out") return <span className="text-error">Out of stock</span>;
                    if (state === "low") return <span className="font-medium text-warning">{p.inventoryQty} · Low</span>;
                    return p.inventoryQty;
                  })()}
                </Td>
                <Td className="tabular">₹{Number(p.price).toLocaleString("en-IN")}</Td>
                <Td className="tabular text-muted">{p.cost != null ? `₹${Number(p.cost).toLocaleString("en-IN")}` : "—"}</Td>
                <Td className="tabular">
                  {(() => {
                    const { profit, margin } = unitEconomics(Number(p.price), p.cost != null ? Number(p.cost) : null);
                    if (profit == null || margin == null) return <span className="text-muted" title="Add a cost to see margin">—</span>;
                    return (
                      <span className={profit < 0 ? "text-error" : undefined}>
                        ₹{profit.toLocaleString("en-IN", { maximumFractionDigits: 2 })} <span className="text-muted">({Math.round(margin * 100)}%)</span>
                      </span>
                    );
                  })()}
                </Td>
                <Td className="tabular">{unitsSold.get(p.id) ?? 0}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
