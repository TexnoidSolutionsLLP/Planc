import Image from "next/image";
import Link from "next/link";
import { prisma } from "@sellly/database";
import { Badge, buttonVariants, EmptyState, Table, Thead, Th, Tr, Td } from "@sellly/ui";
import { requireStore } from "@/lib/session";

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
    },
    include: { images: { take: 1, orderBy: { position: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  const filters = [
    { key: undefined, label: "All" },
    { key: "active", label: "Active" },
    { key: "draft", label: "Draft" },
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
                <Td>{p.inventoryQty === 0 ? <span className="text-error">Out of stock</span> : p.inventoryQty}</Td>
                <Td>₹{Number(p.price).toLocaleString("en-IN")}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
