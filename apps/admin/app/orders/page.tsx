import { prisma } from "@sellly/database";
import { Badge, Table, Thead, Th, Tr, Td } from "@sellly/ui";
import { requireAdmin } from "@/lib/require-admin";

export default async function PlatformOrdersPage() {
  await requireAdmin();

  const orders = await prisma.order.findMany({
    include: { store: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-title text-primary">Orders across the platform</h1>
      <Table>
        <Thead>
          <Tr>
            <Th>Order</Th>
            <Th>Store</Th>
            <Th>Total</Th>
            <Th>Status</Th>
            <Th>Placed</Th>
          </Tr>
        </Thead>
        <tbody>
          {orders.map((o) => (
            <Tr key={o.id}>
              <Td>#{o.orderNumber}</Td>
              <Td>{o.store.name}</Td>
              <Td>₹{Number(o.total).toLocaleString("en-IN")}</Td>
              <Td>
                <Badge>{o.status}</Badge>
              </Td>
              <Td className="text-muted">{o.createdAt.toLocaleDateString("en-IN")}</Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
