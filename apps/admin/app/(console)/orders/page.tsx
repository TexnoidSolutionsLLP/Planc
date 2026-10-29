import Link from "next/link";
import { prisma, storesWithActiveGrant } from "@sellly/database";
import { Badge, Card, Table, Thead, Th, Tr, Td } from "@sellly/ui";
import { requireAdmin } from "@/lib/require-admin";
import { inr } from "@/lib/plans";

/**
 * Platform totals are aggregate counts. Individual orders (with customer
 * contact details) are listed only for stores whose owner has approved
 * "Orders" view access for this staff member.
 */
export default async function PlatformOrdersPage() {
  const staff = await requireAdmin();
  const viewable = await storesWithActiveGrant(staff.id, "ORDERS", "view");

  const [totalOrders, last30, storesWithOrders, orders] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gt: new Date(Date.now() - 30 * 86400_000) } } }),
    prisma.order.groupBy({ by: ["storeId"], _count: true }),
    viewable.length
      ? prisma.order.findMany({
          where: { storeId: { in: viewable } },
          include: { store: { select: { id: true, name: true } }, payment: { select: { method: true, status: true } } },
          orderBy: { createdAt: "desc" },
          take: 200,
        })
      : Promise.resolve([]),
  ]);
  const restrictedStores = storesWithOrders.filter((s) => !viewable.includes(s.storeId)).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-title text-primary">Orders</h1>
        <p className="text-body text-muted">Order details appear only for stores whose owner approved your access.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-small text-muted">Orders on the platform</p>
          <p className="mt-1 text-h2 text-primary">{totalOrders.toLocaleString("en-IN")}</p>
        </Card>
        <Card>
          <p className="text-small text-muted">Last 30 days</p>
          <p className="mt-1 text-h2 text-primary">{last30.toLocaleString("en-IN")}</p>
        </Card>
        <Card>
          <p className="text-small text-muted">Stores with orders you can&apos;t view</p>
          <p className="mt-1 text-h2 text-primary">{restrictedStores}</p>
        </Card>
      </div>

      <p className="text-caption text-muted">Platform fees: Sellly doesn&apos;t take a per-order commission, so there is no fee data to show.</p>

      {orders.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-small text-muted">
          You have no approved order access right now. Open a store and request &ldquo;Orders&rdquo; view access from its owner.
        </p>
      ) : (
        <Table>
          <Thead>
            <Tr>
              <Th>Order</Th>
              <Th>Store</Th>
              <Th>Customer</Th>
              <Th>Total</Th>
              <Th>Status</Th>
              <Th>Payment</Th>
              <Th>Placed</Th>
            </Tr>
          </Thead>
          <tbody>
            {orders.map((o) => (
              <Tr key={o.id}>
                <Td>
                  <Link href={`/stores/${o.store.id}/orders/${o.id}`} className="font-medium text-primary hover:underline">
                    #{o.orderNumber}
                  </Link>
                </Td>
                <Td>{o.store.name}</Td>
                <Td>
                  {o.customerName}
                  <span className="block text-caption text-muted">{o.customerPhone}</span>
                </Td>
                <Td>{inr(Number(o.total))}</Td>
                <Td>
                  <Badge>{o.status}</Badge>
                </Td>
                <Td className="text-small">{o.payment ? `${o.payment.method} · ${o.payment.status}` : <span className="text-muted">Not recorded</span>}</Td>
                <Td className="text-muted">{o.createdAt.toLocaleDateString("en-IN")}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
