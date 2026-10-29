import { NextResponse } from "next/server";
import { prisma, writeAuditLog } from "@sellly/database";
import { requireStoreForApi } from "@/lib/session";
import { toCsv } from "@/lib/csv";

const MAX_ROWS = 10_000;

/** Downloads this store's orders as a spreadsheet-friendly CSV. Scoped to the signed-in merchant's own store. */
export async function GET(_req: Request, { params }: { params: { store: string } }) {
  const access = await requireStoreForApi(params.store);
  if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { store, userId } = access;

  const orders = await prisma.order.findMany({
    where: { storeId: store.id },
    orderBy: { createdAt: "desc" },
    take: MAX_ROWS,
    include: {
      items: { select: { title: true, variantTitle: true, quantity: true } },
      payment: { select: { method: true, status: true, provider: true } },
      shipments: { select: { status: true }, orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const csv = toCsv(
    [
      "Order number", "Placed at (UTC)", "Status", "Customer name", "Phone", "Email",
      "Address line 1", "Address line 2", "City", "State", "Postal code",
      "Items", "Item count", "Subtotal", "Discount", "Discount code", "Shipping", "Total",
      "Payment method", "Payment status", "Payment provider", "Shipment status", "Carrier", "Tracking number",
    ],
    orders.map((o) => [
      o.orderNumber, o.createdAt, o.status, o.customerName, o.customerPhone, o.customerEmail,
      o.shippingLine1, o.shippingLine2, o.shippingCity, o.shippingState, o.shippingPostal,
      o.items.map((i) => `${i.quantity} × ${i.title}${i.variantTitle ? ` (${i.variantTitle})` : ""}`).join("; "),
      o.items.reduce((n, i) => n + i.quantity, 0),
      Number(o.subtotal), Number(o.discountTotal), o.discountCode, Number(o.shippingTotal), Number(o.total),
      o.payment?.method, o.payment?.status, o.payment?.provider, o.shipments[0]?.status, o.carrier, o.trackingNumber,
    ])
  );

  await writeAuditLog({ storeId: store.id, userId, action: "orders.exported", metadata: { rows: orders.length } });

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${store.slug}-orders-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
