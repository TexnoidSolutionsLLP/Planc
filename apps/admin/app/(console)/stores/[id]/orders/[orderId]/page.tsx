import Link from "next/link";
import { notFound } from "next/navigation";
import { getStaffAccessState, prisma } from "@sellly/database";
import { Badge, Button, Card, CardHeader, CardTitle, Select } from "@sellly/ui";
import { requireAdmin } from "@/lib/require-admin";
import { accessStateMessage, gateView } from "@/lib/staff-access";
import { updateOrderStatusAction } from "@/lib/actions";
import { inr } from "@/lib/plans";
import { Notice, Restricted } from "../../../../_components/notice";

const SETTABLE = ["CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];

export default async function AdminOrderDetailPage({
  params,
  searchParams,
}: {
  params: { id: string; orderId: string };
  searchParams: { error?: string; done?: string };
}) {
  const staff = await requireAdmin();
  const store = await prisma.store.findUnique({ where: { id: params.id }, select: { id: true, name: true } });
  if (!store) notFound();

  const back = (
    <Link href={`/stores/${store.id}?tab=orders`} className="text-caption text-muted hover:text-primary">
      ← {store.name} orders
    </Link>
  );

  const view = await gateView(staff.id, store.id, "ORDERS", "order detail");
  if (!view.allowed) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        {back}
        {/* An action refused because access ended still explains itself here. */}
        <Notice error={searchParams.error} />
        <Restricted message={accessStateMessage(view, "ORDERS", "view")} />
      </div>
    );
  }

  // Scoped to the store the grant is for, so an order id from another store 404s.
  const order = await prisma.order.findFirst({
    where: { id: params.orderId, storeId: store.id },
    include: { items: true, payment: true, shipments: true, events: { orderBy: { createdAt: "asc" } }, refunds: true },
  });
  if (!order) notFound();
  const modify = await getStaffAccessState(staff.id, store.id, "ORDERS", "modify");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {back}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-title text-primary">Order #{order.orderNumber}</h1>
        <Badge>{order.status}</Badge>
      </div>
      <Notice error={searchParams.error} done={searchParams.done} messages={{ status: "Order status updated. The merchant can see this change in their activity log." }} />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <ul className="divide-y divide-border text-small">
            {order.items.map((i) => (
              <li key={i.id} className="flex justify-between py-1.5">
                <span>
                  {i.title}
                  {i.variantTitle && <span className="text-muted"> · {i.variantTitle}</span>}
                </span>
                <span className="text-muted">
                  {i.quantity} × {inr(Number(i.price))}
                </span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 grid grid-cols-2 gap-y-1 border-t border-border pt-3 text-small">
            <dt className="text-muted">Subtotal</dt>
            <dd className="text-right">{inr(Number(order.subtotal))}</dd>
            <dt className="text-muted">Discount{order.discountCode ? ` (${order.discountCode})` : ""}</dt>
            <dd className="text-right">−{inr(Number(order.discountTotal))}</dd>
            <dt className="text-muted">Shipping</dt>
            <dd className="text-right">{inr(Number(order.shippingTotal))}</dd>
            <dt className="font-medium">Total</dt>
            <dd className="text-right font-medium">{inr(Number(order.total))}</dd>
            <dt className="text-muted">Platform fee</dt>
            <dd className="text-right text-muted">None — Sellly doesn&apos;t charge per-order fees</dd>
          </dl>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer & delivery</CardTitle>
          </CardHeader>
          <p className="text-small">{order.customerName}</p>
          <p className="text-small text-muted">{order.customerPhone}</p>
          {order.customerEmail && <p className="text-small text-muted">{order.customerEmail}</p>}
          <p className="mt-2 text-small">
            {order.shippingLine1}
            {order.shippingLine2 ? `, ${order.shippingLine2}` : ""}, {order.shippingCity}, {order.shippingState} {order.shippingPostal}
          </p>
          <div className="mt-3 border-t border-border pt-3 text-small">
            <p>
              Payment: {order.payment ? `${order.payment.method} via ${order.payment.provider} — ${order.payment.status}` : "Not recorded"}
            </p>
            {order.refunds.length > 0 && <p>Refunds: {order.refunds.map((r) => `${inr(Number(r.amount))} (${r.status})`).join(", ")}</p>}
            <p>Shipments: {order.shipments.length ? order.shipments.map((s) => s.status).join(", ") : "None"}</p>
            {order.trackingNumber && <p>Tracking: {order.trackingNumber}</p>}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <ul className="space-y-1 text-small">
            {order.events.map((e) => (
              <li key={e.id}>
                <span className="font-medium">{e.status}</span> <span className="text-caption text-muted">{e.createdAt.toLocaleString("en-IN")}</span>
                {e.message && <span className="block text-caption text-muted">{e.message}</span>}
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change status</CardTitle>
          </CardHeader>
          {modify.allowed ? (
            <form action={updateOrderStatusAction.bind(null, store.id, order.id)} className="space-y-2">
              <Select name="status" defaultValue="" required aria-label="New status">
                <option value="" disabled>
                  New status…
                </option>
                {SETTABLE.filter((s) => s !== order.status).map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ").toLowerCase()}
                  </option>
                ))}
              </Select>
              <label className="flex items-center gap-2 text-caption">
                <input type="checkbox" name="confirm" className="h-4 w-4 accent-brand" /> I&apos;m changing this on the merchant&apos;s behalf
              </label>
              <p className="text-caption text-muted">Customers aren&apos;t notified of changes made here; the merchant&apos;s own updates send notifications.</p>
              <Button type="submit" size="sm">
                Update status
              </Button>
            </form>
          ) : (
            <p className="text-small text-muted">{accessStateMessage(modify, "ORDERS", "modify")}</p>
          )}
        </Card>
      </div>
    </div>
  );
}
