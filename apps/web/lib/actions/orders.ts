"use server";

import { revalidatePath } from "next/cache";
import { prisma, writeAuditLog } from "@sellly/database";
import { notifyOrderEvent, type NotificationEvent } from "@sellly/notifications";
import { requireStore } from "@/lib/session";
import type { OrderStatus } from "@sellly/database";

const STATUS_NOTIFICATION_EVENT: Partial<Record<OrderStatus, NotificationEvent>> = {
  SHIPPED: "order_shipped",
  OUT_FOR_DELIVERY: "order_out_for_delivery",
  DELIVERED: "order_delivered",
  REFUNDED: "order_refunded",
};

export async function advanceOrderStatusAction(storeSlug: string, orderId: string, nextStatus: OrderStatus) {
  const { store, userId } = await requireStore(storeSlug);

  const existing = await prisma.order.findFirst({ where: { id: orderId, storeId: store.id } });
  if (!existing) throw new Error("Forbidden");

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

  await writeAuditLog({ storeId: store.id, userId, action: "order.status_changed", entity: "order", entityId: orderId, metadata: { nextStatus } });

  revalidatePath(`/${storeSlug}/orders/${orderId}`);
  revalidatePath(`/${storeSlug}/orders`);
}

export async function cancelOrderAction(storeSlug: string, orderId: string) {
  const { store, userId } = await requireStore(storeSlug);
  await prisma.order.updateMany({
    where: { id: orderId, storeId: store.id },
    data: { status: "CANCELLED" },
  });
  await prisma.orderEvent.create({ data: { orderId, status: "CANCELLED", message: "Cancelled by merchant" } });
  await writeAuditLog({ storeId: store.id, userId, action: "order.cancelled", entity: "order", entityId: orderId });
  revalidatePath(`/${storeSlug}/orders/${orderId}`);
}
