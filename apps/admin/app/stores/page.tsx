import { prisma } from "@sellly/database";
import { Badge, Table, Thead, Th, Tr, Td } from "@sellly/ui";
import { requireAdmin } from "@/lib/require-admin";

export default async function StoresPage() {
  await requireAdmin();

  const stores = await prisma.store.findMany({
    include: { subscription: true, _count: { select: { orders: true, products: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-title text-primary">Stores</h1>
      <Table>
        <Thead>
          <Tr>
            <Th>Store</Th>
            <Th>Status</Th>
            <Th>Plan</Th>
            <Th>Products</Th>
            <Th>Orders</Th>
          </Tr>
        </Thead>
        <tbody>
          {stores.map((s) => (
            <Tr key={s.id}>
              <Td className="font-medium text-primary">{s.name}</Td>
              <Td>
                <Badge variant={s.status === "PUBLISHED" ? "success" : s.status === "SUSPENDED" ? "error" : "default"}>
                  {s.status}
                </Badge>
              </Td>
              <Td>{s.subscription?.plan ?? "FREE"}</Td>
              <Td>{s._count.products}</Td>
              <Td>{s._count.orders}</Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
