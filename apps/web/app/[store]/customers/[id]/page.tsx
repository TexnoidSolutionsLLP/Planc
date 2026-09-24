import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@sellly/database";
import { Badge, Card, CardHeader, CardTitle } from "@sellly/ui";
import { requireStore } from "@/lib/session";
import { orderStatusVariant, orderStatusLabel } from "@/lib/order-status";

export default async function CustomerDetailPage({ params }: { params: { store: string; id: string } }) {
  const { store } = await requireStore(params.store);
  const customer = await prisma.customer.findFirst({
    where: { id: params.id, storeId: store.id },
    include: { orders: { orderBy: { createdAt: "desc" } }, addresses: true },
  });
  if (!customer) notFound();

  const totalSpent = customer.orders.reduce((sum, o) => sum + Number(o.total), 0);
  const avgOrderValue = customer.orders.length ? totalSpent / customer.orders.length : 0;

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
