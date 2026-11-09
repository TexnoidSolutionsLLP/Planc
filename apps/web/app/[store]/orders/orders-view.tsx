import Link from "next/link";
import { MessageCircle } from "lucide-react";
import type { OrderStatus, PaymentStatus } from "@sellly/database";
import { EmptyState } from "@sellly/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BULK_TARGET_STATUSES, orderStatusVariant, orderStatusLabel } from "@/lib/order-status";
import { whatsappOrderLink } from "@/lib/whatsapp";

const PAYMENT_VARIANT = {
  PAID: "success",
  PENDING: "warning",
  FAILED: "error",
  REFUNDED: "secondary",
  PARTIALLY_REFUNDED: "secondary",
} as const;

export type OrderRow = {
  id: string;
  orderNumber: number;
  customerName: string;
  customerPhone: string | null;
  total: number | string;
  status: OrderStatus;
  createdAt: Date;
  _count: { items: number };
  payment: { method: string; status: PaymentStatus } | null;
  shipments: { status: string }[];
};

/** The Orders screen: shared by the real page and the /dev-preview page. */
export function OrdersView({
  store,
  orders,
  notice,
  bulkAction,
}: {
  store: { slug: string; name: string };
  orders: OrderRow[];
  notice: { tone: string; text: string } | null;
  bulkAction: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-title text-primary">Orders</h1>
          <p className="text-body text-muted">Track and fulfill customer orders.</p>
        </div>
        {orders.length > 0 && (
          // A plain link: the route streams a file download.
          <Button asChild variant="secondary">
            <a href={`/${store.slug}/orders/export`} download>
              Export CSV
            </a>
          </Button>
        )}
      </div>

      {notice && <p className={`text-small ${notice.tone}`}>{notice.text}</p>}

      {orders.length === 0 ? (
        <EmptyState title="No orders yet" description="Once you share your store link and a customer checks out, orders will show up here." />
      ) : (
        <form action={bulkAction} className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
            <Label htmlFor="bulk-status" className="text-small text-muted">
              Selected orders:
            </Label>
            <Select name="status" required>
              <SelectTrigger id="bulk-status" className="h-9 w-44">
                <SelectValue placeholder="Mark as…" />
              </SelectTrigger>
              <SelectContent>
                {BULK_TARGET_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {orderStatusLabel(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit" size="sm" variant="secondary">
              Apply
            </Button>
            <span className="text-caption text-muted">Only moves orders forward. Customers are notified as usual.</span>
          </div>

          <Card className="overflow-hidden">
          <TooltipProvider>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">
                  <span className="sr-only">Select</span>
                </TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Placed</TableHead>
                <TableHead>
                  <span className="sr-only">WhatsApp</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => {
                const chat = whatsappOrderLink({
                  phone: o.customerPhone,
                  customerName: o.customerName,
                  storeName: store.name,
                  orderNumber: o.orderNumber,
                });
                const shipment = o.shipments[0];
                return (
                  <TableRow key={o.id}>
                    <TableCell>
                      <Checkbox name="orderIds" value={o.id} aria-label={`Select order #${o.orderNumber}`} />
                    </TableCell>
                    <TableCell>
                      <Link href={`/${store.slug}/orders/${o.id}`} className="font-medium text-primary hover:underline">
                        #{o.orderNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <p>{o.customerName}</p>
                      <p className="text-caption text-muted">{o.customerPhone}</p>
                    </TableCell>
                    <TableCell>{o._count.items}</TableCell>
                    <TableCell className="tabular">₹{Number(o.total).toLocaleString("en-IN")}</TableCell>
                    <TableCell>
                      {o.payment ? (
                        <div className="space-y-0.5">
                          <Badge variant={PAYMENT_VARIANT[o.payment.status]}>{orderStatusLabel(o.payment.status)}</Badge>
                          <p className="text-caption text-muted">{o.payment.method}</p>
                        </div>
                      ) : (
                        <span className="text-caption text-muted">Not recorded</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={orderStatusVariant(o.status) === "default" ? "secondary" : orderStatusVariant(o.status)}>{orderStatusLabel(o.status)}</Badge>
                      {shipment && <p className="mt-0.5 text-caption text-muted">Shipment: {orderStatusLabel(shipment.status)}</p>}
                    </TableCell>
                    <TableCell className="text-muted">{o.createdAt.toLocaleDateString("en-IN")}</TableCell>
                    <TableCell>
                      {chat && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted hover:text-success">
                              <a
                                href={chat}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`Message ${o.customerName} on WhatsApp about order #${o.orderNumber}`}
                              >
                                <MessageCircle />
                              </a>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Open a WhatsApp chat (nothing is sent until you press send)</TooltipContent>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </TooltipProvider>
          </Card>
        </form>
      )}
    </div>
  );
}
