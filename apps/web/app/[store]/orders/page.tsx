import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { prisma } from "@sellly/database";
import { Badge, Button, EmptyState, Select, Table, Thead, Th, Tr, Td, buttonVariants } from "@sellly/ui";
import { requireStore } from "@/lib/session";
import { BULK_TARGET_STATUSES, orderStatusVariant, orderStatusLabel } from "@/lib/order-status";
import { bulkUpdateOrderStatusAction } from "@/lib/actions/orders";
import { whatsappOrderLink } from "@/lib/whatsapp";

const PAYMENT_VARIANT = { PAID: "success", PENDING: "warning", FAILED: "error", REFUNDED: "default", PARTIALLY_REFUNDED: "default" } as const;

function bulkNotice(raw?: string) {
  if (!raw) return null;
  if (raw === "invalid") return { tone: "text-error", text: "Select at least one order and a status." };
  const [updated, skipped] = raw.split("-").map(Number);
  if (!Number.isFinite(updated)) return null;
  return {
    tone: "text-primary",
    text: `Updated ${updated} order${updated === 1 ? "" : "s"}.${skipped ? ` Skipped ${skipped} that were already past that status, cancelled, or not found.` : ""}`,
  };
}

export default async function OrdersPage({ params, searchParams }: { params: { store: string }; searchParams: { bulk?: string } }) {
  const { store } = await requireStore(params.store);
  const orders = await prisma.order.findMany({
    where: { storeId: store.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { items: true } },
      payment: { select: { method: true, status: true } },
      shipments: { select: { status: true }, orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  const notice = bulkNotice(searchParams.bulk);
  const bulkAction = bulkUpdateOrderStatusAction.bind(null, store.slug);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-title text-primary">Orders</h1>
          <p className="text-body text-muted">Track and fulfill customer orders.</p>
        </div>
        {orders.length > 0 && (
          // A plain link: the route streams a file download.
          <a href={`/${store.slug}/orders/export`} className={buttonVariants({ variant: "secondary" })} download>
            Export CSV
          </a>
        )}
      </div>

      {notice && <p className={`text-small ${notice.tone}`}>{notice.text}</p>}

      {orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="Once you share your store link and a customer checks out, orders will show up here."
        />
      ) : (
        <form action={bulkAction} className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
            <label htmlFor="bulk-status" className="text-small text-muted">
              Selected orders:
            </label>
            <Select id="bulk-status" name="status" defaultValue="" className="h-9 w-auto" required>
              <option value="" disabled>
                Mark as…
              </option>
              {BULK_TARGET_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {orderStatusLabel(s)}
                </option>
              ))}
            </Select>
            <Button type="submit" size="sm" variant="secondary">
              Apply
            </Button>
            <span className="text-caption text-muted">Only moves orders forward. Customers are notified as usual.</span>
          </div>

          <Table>
            <Thead>
              <Tr>
                <Th className="w-8">
                  <span className="sr-only">Select</span>
                </Th>
                <Th>Order</Th>
                <Th>Customer</Th>
                <Th>Items</Th>
                <Th>Total</Th>
                <Th>Payment</Th>
                <Th>Status</Th>
                <Th>Placed</Th>
                <Th>
                  <span className="sr-only">WhatsApp</span>
                </Th>
              </Tr>
            </Thead>
            <tbody>
              {orders.map((o) => {
                const chat = whatsappOrderLink({ phone: o.customerPhone, customerName: o.customerName, storeName: store.name, orderNumber: o.orderNumber });
                const shipment = o.shipments[0];
                return (
                  <Tr key={o.id}>
                    <Td>
                      <input type="checkbox" name="orderIds" value={o.id} aria-label={`Select order #${o.orderNumber}`} className="h-4 w-4 accent-brand" />
                    </Td>
                    <Td>
                      <Link href={`/${store.slug}/orders/${o.id}`} className="font-medium text-primary hover:underline">
                        #{o.orderNumber}
                      </Link>
                    </Td>
                    <Td>
                      <p>{o.customerName}</p>
                      <p className="text-caption text-muted">{o.customerPhone}</p>
                    </Td>
                    <Td>{o._count.items}</Td>
                    <Td className="tabular">₹{Number(o.total).toLocaleString("en-IN")}</Td>
                    <Td>
                      {o.payment ? (
                        <div className="space-y-0.5">
                          <Badge variant={PAYMENT_VARIANT[o.payment.status]}>{orderStatusLabel(o.payment.status)}</Badge>
                          <p className="text-caption text-muted">{o.payment.method}</p>
                        </div>
                      ) : (
                        <span className="text-caption text-muted">Not recorded</span>
                      )}
                    </Td>
                    <Td>
                      <Badge variant={orderStatusVariant(o.status)}>{orderStatusLabel(o.status)}</Badge>
                      {shipment && <p className="mt-0.5 text-caption text-muted">Shipment: {orderStatusLabel(shipment.status)}</p>}
                    </Td>
                    <Td className="text-muted">{o.createdAt.toLocaleDateString("en-IN")}</Td>
                    <Td>
                      {chat && (
                        <a
                          href={chat}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-8 w-8 items-center justify-center rounded text-muted hover:bg-secondary hover:text-success"
                          aria-label={`Message ${o.customerName} on WhatsApp about order #${o.orderNumber}`}
                          title="Open a WhatsApp chat (nothing is sent until you press send)"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </a>
                      )}
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        </form>
      )}
    </div>
  );
}
