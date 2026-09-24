import { prisma } from "@sellly/database";
import { Badge, Card, Input, Label, Button } from "@sellly/ui";
import { getPublishedStore } from "@/lib/store";
import { orderStatusVariant } from "@/lib/order-status";

export default async function TrackOrderPage({
  params,
  searchParams,
}: {
  params: { store: string };
  searchParams: { order?: string; phone?: string };
}) {
  const store = await getPublishedStore(params.store);

  let order = null;
  if (searchParams.order) {
    order = await prisma.order.findFirst({
      where: { id: searchParams.order, storeId: store.id, ...(searchParams.phone ? { customerPhone: searchParams.phone } : {}) },
      include: { events: { orderBy: { createdAt: "asc" } } },
    });
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="mb-6 text-h1 text-primary">Track your order</h1>

      <Card>
        <form className="space-y-4" action={`/${store.slug}/track`}>
          <div className="space-y-1.5">
            <Label htmlFor="order">Order ID</Label>
            <Input id="order" name="order" defaultValue={searchParams.order} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone number used at checkout</Label>
            <Input id="phone" name="phone" defaultValue={searchParams.phone} required />
          </div>
          <Button type="submit" className="w-full">
            Track
          </Button>
        </form>
      </Card>

      {searchParams.order && !order && (
        <p className="mt-4 text-small text-error">We couldn&apos;t find an order with those details.</p>
      )}

      {order && (
        <Card className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-medium text-primary">Order #{order.orderNumber}</p>
            <Badge variant={orderStatusVariant(order.status)}>{order.status}</Badge>
          </div>
          <ul className="space-y-2 border-t border-border pt-4">
            {order.events.map((e) => (
              <li key={e.id} className="text-small">
                <span className="font-medium text-primary">{e.status.replace(/_/g, " ")}</span>{" "}
                <span className="text-caption text-muted">{e.createdAt.toLocaleString("en-IN")}</span>
              </li>
            ))}
          </ul>
          {order.trackingNumber && <p className="mt-4 text-small text-muted">Tracking number: {order.trackingNumber}</p>}
        </Card>
      )}
    </div>
  );
}
