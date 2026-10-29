import Link from "next/link";
import { prisma } from "@sellly/database";
import { EmptyState, Table, Thead, Th, Tr, Td } from "@sellly/ui";
import { requireStore } from "@/lib/session";
import { NOT_SPENT_STATUSES } from "@/lib/order-status";

export default async function CustomersPage({ params }: { params: { store: string } }) {
  const { store } = await requireStore(params.store);
  const customers = await prisma.customer.findMany({
    where: { storeId: store.id },
    include: {
      orders: { select: { total: true, status: true, createdAt: true, shippingCity: true, shippingState: true }, orderBy: { createdAt: "desc" } },
      addresses: { select: { city: true, state: true, isDefault: true } },
    },
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
              <Th>Location</Th>
              <Th>Orders</Th>
              <Th title="Excludes cancelled, failed, refunded and returned orders">Total spent</Th>
              <Th>Avg. order</Th>
              <Th>Last order</Th>
            </Tr>
          </Thead>
          <tbody>
            {customers.map((c) => {
              const counted = c.orders.filter((o) => !NOT_SPENT_STATUSES.includes(o.status));
              const totalSpent = counted.reduce((sum, o) => sum + Number(o.total), 0);
              const avg = counted.length ? totalSpent / counted.length : null;
              const lastOrder = c.orders[0];
              const address = c.addresses.find((a) => a.isDefault) ?? c.addresses[0];
              const city = address?.city ?? lastOrder?.shippingCity;
              const state = address?.state ?? lastOrder?.shippingState;
              return (
                <Tr key={c.id}>
                  <Td>
                    <Link href={`/${store.slug}/customers/${c.id}`} className="font-medium text-primary hover:underline">
                      {c.name}
                    </Link>
                  </Td>
                  <Td className="text-muted">
                    {c.phone && <p>{c.phone}</p>}
                    {c.email && <p className="text-caption">{c.email}</p>}
                    {!c.phone && !c.email && "—"}
                  </Td>
                  <Td className="text-muted">{city || state ? [city, state].filter(Boolean).join(", ") : "—"}</Td>
                  <Td>{c.orders.length}</Td>
                  <Td className="tabular">₹{totalSpent.toLocaleString("en-IN")}</Td>
                  <Td className="tabular">{avg != null ? `₹${Math.round(avg).toLocaleString("en-IN")}` : "—"}</Td>
                  <Td className="text-muted">{lastOrder ? lastOrder.createdAt.toLocaleDateString("en-IN") : "—"}</Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </div>
  );
}
