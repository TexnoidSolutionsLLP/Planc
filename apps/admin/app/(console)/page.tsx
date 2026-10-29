import Link from "next/link";
import { prisma, storesWithActiveGrant, type Prisma } from "@sellly/database";
import { Badge, Button, Input, Table, Thead, Th, Tr, Td } from "@sellly/ui";
import { requireAdmin } from "@/lib/require-admin";
import { inr } from "@/lib/plans";

/**
 * Merchant accounts are Sellly's own customer records, so name, email, phone,
 * dates and status are platform-level. Sales are the merchant's business data:
 * a total shows only when the owner has approved "Store details" view for
 * every one of their stores.
 */
export default async function MerchantsPage({ searchParams }: { searchParams: { q?: string } }) {
  const staff = await requireAdmin();
  const q = searchParams.q?.trim();
  const where: Prisma.UserWhereInput = {
    platformRole: "MERCHANT",
    ...(q && { OR: [{ email: { contains: q, mode: "insensitive" } }, { name: { contains: q, mode: "insensitive" } }] }),
  };

  const [users, viewable] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { memberships: { include: { store: { select: { id: true, name: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    storesWithActiveGrant(staff.id, "STORE", "view"),
  ]);
  const viewableSet = new Set(viewable);

  const salesRows = viewable.length
    ? await prisma.order.groupBy({
        by: ["storeId"],
        where: { storeId: { in: viewable }, status: { notIn: ["CANCELLED", "FAILED", "REFUNDED", "RETURNED"] } },
        _sum: { total: true },
      })
    : [];
  const salesByStore = new Map(salesRows.map((r) => [r.storeId, Number(r._sum.total ?? 0)]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-title text-primary">Merchants</h1>
        <p className="text-body text-muted">Merchant accounts. Sales totals need the owner&apos;s approval to view store details.</p>
      </div>

      <form className="flex gap-2">
        <Input name="q" defaultValue={q} placeholder="Search name or email" className="h-9 w-64" aria-label="Search merchants" />
        <Button type="submit" size="sm" variant="secondary">
          Search
        </Button>
      </form>

      <Table>
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Contact</Th>
            <Th>Stores</Th>
            <Th>Registered</Th>
            <Th>Last active</Th>
            <Th>Total sales</Th>
            <Th>Status</Th>
          </Tr>
        </Thead>
        <tbody>
          {users.map((u) => {
            const storeIds = u.memberships.map((m) => m.store.id);
            const allViewable = storeIds.length > 0 && storeIds.every((id) => viewableSet.has(id));
            return (
              <Tr key={u.id}>
                <Td>{u.name ?? "—"}</Td>
                <Td className="text-muted">
                  {u.email}
                  {u.phone && <span className="block text-caption">{u.phone}</span>}
                </Td>
                <Td>
                  {u.memberships.length === 0 && <span className="text-muted">None</span>}
                  {u.memberships.map((m) => (
                    <Link key={m.id} href={`/stores/${m.store.id}`} className="mr-1 inline-block">
                      <Badge className="hover:underline">
                        {m.store.name}
                        {m.role !== "OWNER" ? ` (${m.role.toLowerCase()})` : ""}
                      </Badge>
                    </Link>
                  ))}
                </Td>
                <Td className="text-muted">{u.createdAt.toLocaleDateString("en-IN")}</Td>
                <Td className="text-muted">{u.lastActiveAt ? u.lastActiveAt.toLocaleDateString("en-IN") : "—"}</Td>
                <Td>
                  {storeIds.length === 0 ? (
                    "—"
                  ) : allViewable ? (
                    inr(storeIds.reduce((n, id) => n + (salesByStore.get(id) ?? 0), 0))
                  ) : (
                    <span className="text-caption text-muted" title="Request 'Store details' view access from the owner">
                      Needs approval
                    </span>
                  )}
                </Td>
                <Td>
                  <Badge variant={u.status === "ACTIVE" ? "success" : "error"}>{u.status}</Badge>
                </Td>
              </Tr>
            );
          })}
        </tbody>
      </Table>
      {users.length === 0 && <p className="text-small text-muted">No merchants match.</p>}
      <p className="text-caption text-muted">Account actions (suspend/reactivate) are on each store&apos;s page and need the owner&apos;s approval.</p>
    </div>
  );
}
