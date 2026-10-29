import { notFound } from "next/navigation";
import { prisma } from "@sellly/database";
import { Badge, Button, Card, CardHeader, CardTitle, buttonVariants } from "@sellly/ui";
import { requireStore } from "@/lib/session";
import { orderStatusVariant, orderStatusLabel, ORDER_STATUS_FLOW } from "@/lib/order-status";
import { advanceOrderStatusAction, cancelOrderAction } from "@/lib/actions/orders";
import { ConfirmAction } from "../../_components/confirm-action";
import { whatsappOrderLink } from "@/lib/whatsapp";

export default async function OrderDetailPage({ params }: { params: { store: string; id: string } }) {
  const { store } = await requireStore(params.store);
  const order = await prisma.order.findFirst({
    where: { id: params.id, storeId: store.id },
    include: {
      items: true,
      payment: true,
      events: { orderBy: { createdAt: "asc" } },
      customer: true,
      shipments: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!order) notFound();

  const currentIndex = ORDER_STATUS_FLOW.indexOf(order.status as any);
  const nextStatus = currentIndex >= 0 && currentIndex < ORDER_STATUS_FLOW.length - 1 ? ORDER_STATUS_FLOW[currentIndex + 1] : null;
  const canAdvance = nextStatus && !["CANCELLED", "FAILED", "REFUNDED", "RETURNED"].includes(order.status);
  const canCancel = !["DELIVERED", "CANCELLED", "REFUNDED", "RETURNED"].includes(order.status);

  const advanceAction = nextStatus ? advanceOrderStatusAction.bind(null, store.slug, order.id, nextStatus) : undefined;
  const cancelAction = cancelOrderAction.bind(null, store.slug, order.id);
  const chat = whatsappOrderLink({ phone: order.customerPhone, customerName: order.customerName, storeName: store.name, orderNumber: order.orderNumber });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-title text-primary">Order #{order.orderNumber}</h1>
          <p className="text-body text-muted">Placed {order.createdAt.toLocaleString("en-IN")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={orderStatusVariant(order.status)}>{orderStatusLabel(order.status)}</Badge>
          {canAdvance && advanceAction && (
            <form action={advanceAction}>
              <Button type="submit" size="sm">
                Mark as {nextStatus?.replace(/_/g, " ").toLowerCase()}
              </Button>
            </form>
          )}
          {canCancel && (
            <ConfirmAction
              action={cancelAction}
              triggerLabel="Cancel order"
              title="Cancel this order?"
              description="The customer won't receive it. This can't be undone."
              confirmLabel="Cancel order"
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <ul className="divide-y divide-border">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between py-3 text-small">
                <div>
                  <p className="font-medium text-primary">{item.title}</p>
                  {item.variantTitle && <p className="text-caption text-muted">{item.variantTitle}</p>}
                </div>
                <p className="text-muted">
                  {item.quantity} × ₹{Number(item.price).toLocaleString("en-IN")}
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-1 border-t border-border pt-4 text-small">
            <div className="flex justify-between">
              <span className="text-muted">Subtotal</span>
              <span>₹{Number(order.subtotal).toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Shipping</span>
              <span>₹{Number(order.shippingTotal).toLocaleString("en-IN")}</span>
            </div>
            {Number(order.discountTotal) > 0 && (
              <div className="flex justify-between text-success">
                <span>Discount {order.discountCode ? `(${order.discountCode})` : ""}</span>
                <span>-₹{Number(order.discountTotal).toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="flex justify-between text-body font-medium text-primary">
              <span>Total</span>
              <span>₹{Number(order.total).toLocaleString("en-IN")}</span>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <p className="text-small font-medium text-primary">{order.customerName}</p>
            <p className="text-small text-muted">{order.customerPhone}</p>
            {order.customerEmail && <p className="text-small text-muted">{order.customerEmail}</p>}
            {chat ? (
              <a href={chat} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "secondary", size: "sm", className: "mt-3" })}>
                Message on WhatsApp
              </a>
            ) : (
              <p className="mt-3 text-caption text-muted">No valid WhatsApp number on this order.</p>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipping</CardTitle>
            </CardHeader>
            <p className="text-small text-primary">{order.shippingLine1}</p>
            {order.shippingLine2 && <p className="text-small text-primary">{order.shippingLine2}</p>}
            <p className="text-small text-primary">
              {order.shippingCity}, {order.shippingState} {order.shippingPostal}
            </p>
            {order.trackingNumber && <p className="mt-2 text-caption text-muted">Tracking: {order.trackingNumber}</p>}
            {order.shipments.length > 0 ? (
              <ul className="mt-3 space-y-1 border-t border-border pt-3">
                {order.shipments.map((sh) => (
                  <li key={sh.id} className="text-caption text-muted">
                    Shipment {sh.provider ? `via ${sh.provider} ` : ""}— <span className="font-medium text-primary">{orderStatusLabel(sh.status)}</span>
                    {sh.deliveredAt ? `, delivered ${sh.deliveredAt.toLocaleDateString("en-IN")}` : sh.shippedAt ? `, shipped ${sh.shippedAt.toLocaleDateString("en-IN")}` : ""}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-caption text-muted">No shipment created yet.</p>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            {order.payment ? (
              <>
                <p className="text-small text-primary">
                  {order.payment.method} — <Badge variant={order.payment.status === "PAID" ? "success" : "warning"}>{order.payment.status}</Badge>
                </p>
                <p className="text-caption text-muted">via {order.payment.provider}</p>
              </>
            ) : (
              <p className="text-small text-muted">No payment recorded.</p>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <ul className="space-y-2">
              {order.events.map((e) => (
                <li key={e.id} className="text-small">
                  <span className="font-medium text-primary">{e.status}</span>{" "}
                  <span className="text-caption text-muted">{e.createdAt.toLocaleString("en-IN")}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
