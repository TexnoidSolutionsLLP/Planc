import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@sellly/database";
import { Badge, Card, CardHeader, CardTitle } from "@sellly/ui";
import { requireStore } from "@/lib/session";
import { NOT_SPENT_STATUSES, orderStatusVariant, orderStatusLabel } from "@/lib/order-status";

export default async function CustomerDetailPage({ params }: { params: { store: string; id: string } }) {
  const { store } = await requireStore(params.store);
  const customer = await prisma.customer.findFirst({
    where: { id: params.id, storeId: store.id },
    include: { orders: { orderBy: { createdAt: "desc" } }, addresses: true },
  });
  if (!customer) notFound();

  // Same rule as the customer list: cancelled, failed, refunded and returned orders don't count as spend.
  const counted = customer.orders.filter((o) => !NOT_SPENT_STATUSES.includes(o.status));
  const totalSpent = counted.reduce((sum, o) => sum + Number(o.total), 0);
  const avgOrderValue = counted.length ? totalSpent / counted.length : 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-title text-primary">{customer.name}</h1>
        <p className="text-body text-muted">
          {customer.phone} {customer.email ? `· ${customer.email}` : ""}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <p className="text-small text-muted">Orders</p>
          <p className="mt-1 text-h3 text-primary">{customer.orders.length}</p>
        </Card>
        <Card>
          <p className="text-small text-muted">Total spent</p>
          <p className="mt-1 text-h3 text-primary">₹{totalSpent.toLocaleString("en-IN")}</p>
        </Card>
        <Card>
          <p className="text-small text-muted">Avg. order value</p>
          <p className="mt-1 text-h3 text-primary">₹{avgOrderValue.toFixed(0)}</p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order history</CardTitle>
        </CardHeader>
        <ul className="divide-y divide-border">
          {customer.orders.map((o) => (
            <li key={o.id} className="flex items-center justify-between py-3 text-small">
              <Link href={`/${store.slug}/orders/${o.id}`} className="text-primary hover:underline">
                #{o.orderNumber}
              </Link>
              <span className="text-muted">₹{Number(o.total).toLocaleString("en-IN")}</span>
              <Badge variant={orderStatusVariant(o.status)}>{orderStatusLabel(o.status)}</Badge>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
