import Link from "next/link";
import { prisma } from "@sellly/database";
import { Badge, EmptyState, Table, Thead, Th, Tr, Td } from "@sellly/ui";
import { requireStore } from "@/lib/session";
import { orderStatusVariant, orderStatusLabel } from "@/lib/order-status";

export default async function OrdersPage({ params }: { params: { store: string } }) {
  const { store } = await requireStore(params.store);
  const orders = await prisma.order.findMany({
    where: { storeId: store.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { items: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-title text-primary">Orders</h1>
        <p className="text-body text-muted">Track and fulfill customer orders.</p>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="Once you share your store link and a customer checks out, orders will show up here."
        />
      ) : (
        <Table>
          <Thead>
            <Tr>
              <Th>Order</Th>
              <Th>Customer</Th>
              <Th>Items</Th>
              <Th>Total</Th>
              <Th>Status</Th>
              <Th>Placed</Th>
            </Tr>
          </Thead>
          <tbody>
            {orders.map((o) => (
              <Tr key={o.id}>
                <Td>
                  <Link href={`/${store.slug}/orders/${o.id}`} className="font-medium text-primary hover:underline">
                    #{o.orderNumber}
                  </Link>
                </Td>
                <Td>{o.customerName}</Td>
                <Td>{o._count.items}</Td>
                <Td>₹{Number(o.total).toLocaleString("en-IN")}</Td>
                <Td>
                  <Badge variant={orderStatusVariant(o.status)}>{orderStatusLabel(o.status)}</Badge>
                </Td>
                <Td className="text-muted">{o.createdAt.toLocaleDateString("en-IN")}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
