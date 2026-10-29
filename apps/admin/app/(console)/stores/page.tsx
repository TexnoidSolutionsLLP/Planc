import Link from "next/link";
import { prisma, type Prisma } from "@sellly/database";
import { Badge, Input, Select, Table, Thead, Th, Tr, Td, Button } from "@sellly/ui";
import { requireAdmin } from "@/lib/require-admin";
import { liveUrl, paymentSetup } from "../_components/store-info";

/** Platform-level directory: no merchant approval needed, so no addresses, contacts or sales here. */
export default async function StoresPage({ searchParams }: { searchParams: { q?: string; status?: string } }) {
  await requireAdmin();
  const q = searchParams.q?.trim();
  const status = ["DRAFT", "PUBLISHED", "SUSPENDED"].includes(searchParams.status ?? "") ? (searchParams.status as "DRAFT") : undefined;
  const where: Prisma.StoreWhereInput = {
    ...(status && { status }),
    ...(q && { OR: [{ name: { contains: q, mode: "insensitive" } }, { slug: { contains: q, mode: "insensitive" } }] }),
  };

  const stores = await prisma.store.findMany({
    where,
    include: {
      subscription: true,
      storeSettings: { select: { codEnabled: true, onlinePaymentEnabled: true } },
      paymentConnections: { select: { provider: true, isActive: true } },
      domains: { select: { hostname: true, isSubdomain: true, status: true, isPrimary: true } },
      members: { where: { role: "OWNER" }, include: { user: { select: { name: true, email: true, phone: true } } } },
      _count: { select: { orders: true, products: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-title text-primary">Stores</h1>
        <p className="text-body text-muted">Platform view. Addresses, sales and customer data need the store owner&apos;s approval — open a store to request it.</p>
      </div>

      <form className="flex flex-wrap gap-2">
        <Input name="q" defaultValue={q} placeholder="Search name or slug" className="h-9 w-64" aria-label="Search stores" />
        <Select name="status" defaultValue={status ?? ""} className="h-9 w-auto" aria-label="Status">
          <option value="">All statuses</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
          <option value="SUSPENDED">Suspended</option>
        </Select>
        <Button type="submit" size="sm" variant="secondary">
          Filter
        </Button>
      </form>

      <Table>
        <Thead>
          <Tr>
            <Th>Store</Th>
            <Th>Owner</Th>
            <Th>Status</Th>
            <Th>Plan</Th>
            <Th>Products</Th>
            <Th>Orders</Th>
            <Th>Payments</Th>
            <Th>Web address</Th>
          </Tr>
        </Thead>
        <tbody>
          {stores.map((s) => {
            const live = liveUrl(s.slug, s.domains);
            const payments = paymentSetup(s.storeSettings, s.paymentConnections);
            const owner = s.members[0]?.user;
            return (
              <Tr key={s.id}>
                <Td>
                  <Link href={`/stores/${s.id}`} className="font-medium text-primary hover:underline">
                    {s.name}
                  </Link>
                  <a href={live.url} target="_blank" rel="noopener noreferrer" className="block text-caption text-muted hover:text-primary">
                    {live.url.replace(/^https?:\/\//, "")}
                  </a>
                </Td>
                <Td>
                  {owner ? (
                    <>
                      <p>{owner.name ?? "—"}</p>
                      <p className="text-caption text-muted">{owner.email}</p>
                      {owner.phone && <p className="text-caption text-muted">{owner.phone}</p>}
                    </>
                  ) : (
                    <span className="text-muted">No owner</span>
                  )}
                </Td>
                <Td>
                  <Badge variant={s.status === "PUBLISHED" ? "success" : s.status === "SUSPENDED" ? "error" : "default"}>{s.status}</Badge>
                </Td>
                <Td>
                  {s.subscription?.plan ?? "FREE"}
                  {s.subscription && s.subscription.status !== "ACTIVE" && <p className="text-caption text-warning">{s.subscription.status}</p>}
                </Td>
                <Td>{s._count.products}</Td>
                <Td>{s._count.orders}</Td>
                <Td className={payments.ok ? "" : "text-warning"}>{payments.label}</Td>
                <Td className="text-muted">{live.custom ? "Own domain" : "Sellly address"}</Td>
              </Tr>
            );
          })}
        </tbody>
      </Table>
      {stores.length === 0 && <p className="text-small text-muted">No stores match.</p>}
    </div>
  );
}
