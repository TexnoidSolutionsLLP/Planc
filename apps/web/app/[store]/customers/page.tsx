import Link from "next/link";
import { prisma } from "@sellly/database";
import { EmptyState, Table, Thead, Th, Tr, Td } from "@sellly/ui";
import { requireStore } from "@/lib/session";

export default async function CustomersPage({ params }: { params: { store: string } }) {
  const { store } = await requireStore(params.store);
  const customers = await prisma.customer.findMany({
    where: { storeId: store.id },
    include: { orders: { select: { total: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-title text-primary">Customers</h1>
        <p className="text-body text-muted">Everyone who has ordered from your store.</p>
      </div>

      {customers.length === 0 ? (
        <EmptyState title="No customers yet" description="Customers appear here after their first order." />
      ) : (
        <Table>
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Contact</Th>
              <Th>Orders</Th>
              <Th>Total spent</Th>
            </Tr>
          </Thead>
          <tbody>
            {customers.map((c) => {
              const totalSpent = c.orders.reduce((sum, o) => sum + Number(o.total), 0);
              return (
                <Tr key={c.id}>
                  <Td>
                    <Link href={`/${store.slug}/customers/${c.id}`} className="font-medium text-primary hover:underline">
                      {c.name}
                    </Link>
                  </Td>
                  <Td className="text-muted">{c.phone ?? c.email ?? "—"}</Td>
                  <Td>{c.orders.length}</Td>
                  <Td>₹{totalSpent.toLocaleString("en-IN")}</Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </div>
  );
}
