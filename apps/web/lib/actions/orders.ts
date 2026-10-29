"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma, writeAuditLog } from "@sellly/database";
import { notifyOrderEvent, type NotificationEvent } from "@sellly/notifications";
import { requireStore } from "@/lib/session";
import type { OrderStatus } from "@sellly/database";
import { BULK_TARGET_STATUSES, canBulkAdvance } from "@/lib/order-status";

const STATUS_NOTIFICATION_EVENT: Partial<Record<OrderStatus, NotificationEvent>> = {
  SHIPPED: "order_shipped",
  OUT_FOR_DELIVERY: "order_out_for_delivery",
  DELIVERED: "order_delivered",
  REFUNDED: "order_refunded",
};

type StoreCtx = { id: string; name: string };

/** Moves one order (already confirmed to belong to `store`) to `nextStatus`, notifies the customer and audits it. */
async function applyStatusChange(store: StoreCtx, userId: string, orderId: string, nextStatus: OrderStatus, auditAction = "order.status_changed") {
  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: nextStatus,
      events: { create: { status: nextStatus } },
    },
  });

  const event = STATUS_NOTIFICATION_EVENT[nextStatus];
  if (event) {
    const settings = await prisma.storeSettings.findUnique({ where: { storeId: store.id } });
    await notifyOrderEvent(
      store.id,
      event,
      { customerEmail: order.customerEmail, customerPhone: order.customerPhone },
      settings?.whatsappEnabled ?? false,
      { orderNumber: order.orderNumber, storeName: store.name, total: order.total, trackingNumber: order.trackingNumber }
    );
  }

  await writeAuditLog({ storeId: store.id, userId, action: auditAction, entity: "order", entityId: orderId, metadata: { nextStatus } });
}

export async function advanceOrderStatusAction(storeSlug: string, orderId: string, nextStatus: OrderStatus) {
  const { store, userId } = await requireStore(storeSlug);

  const existing = await prisma.order.findFirst({ where: { id: orderId, storeId: store.id } });
  if (!existing) throw new Error("Forbidden");

  await applyStatusChange(store, userId, orderId, nextStatus);

  revalidatePath(`/${storeSlug}/orders/${orderId}`);
  revalidatePath(`/${storeSlug}/orders`);
}

/**
 * Moves the selected orders forward to one status. Orders from another store
 * are ignored (the lookup is scoped to this store), and orders that can't
 * move forward to the target — already past it, cancelled, refunded, etc. — are skipped.
 */
export async function bulkUpdateOrderStatusAction(storeSlug: string, formData: FormData) {
  const { store, userId } = await requireStore(storeSlug);
  const target = String(formData.get("status") ?? "") as OrderStatus;
  const ids = formData.getAll("orderIds").map(String).slice(0, 200);
  if (!BULK_TARGET_STATUSES.includes(target) || ids.length === 0) {
    redirect(`/${storeSlug}/orders?bulk=invalid`);
  }

  const orders = await prisma.order.findMany({ where: { id: { in: ids }, storeId: store.id }, select: { id: true, status: true } });
  let updated = 0;
  for (const order of orders) {
    if (!canBulkAdvance(order.status, target)) continue;
    await applyStatusChange(store, userId, order.id, target, "order.bulk_status_changed");
    updated += 1;
  }

  revalidatePath(`/${storeSlug}/orders`);
  redirect(`/${storeSlug}/orders?bulk=${updated}-${ids.length - updated}`);
}

export async function cancelOrderAction(storeSlug: string, orderId: string) {
  const { store, userId } = await requireStore(storeSlug);
  const result = await prisma.order.updateMany({
    where: { id: orderId, storeId: store.id },
    data: { status: "CANCELLED" },
  });
  // Zero rows means the order belongs to another store — don't write an event onto it.
  if (result.count === 0) throw new Error("Forbidden");
  await prisma.orderEvent.create({ data: { orderId, status: "CANCELLED", message: "Cancelled by merchant" } });
  await writeAuditLog({ storeId: store.id, userId, action: "order.cancelled", entity: "order", entityId: orderId });
  revalidatePath(`/${storeSlug}/orders/${orderId}`);
}
