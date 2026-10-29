import type { OrderStatus } from "@sellly/database";

const map: Record<OrderStatus, "default" | "success" | "warning" | "error" | "accent"> = {
  PENDING: "warning",
  CONFIRMED: "accent",
  PROCESSING: "accent",
  PACKED: "accent",
  SHIPPED: "accent",
  OUT_FOR_DELIVERY: "accent",
  DELIVERED: "success",
  CANCELLED: "error",
  FAILED: "error",
  REFUNDED: "default",
  RETURNED: "default",
};

export function orderStatusVariant(status: OrderStatus) {
  return map[status];
}

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

export function orderStatusLabel(status: string) {
  const text = status.replace(/_/g, " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Bulk updates only move orders forward along the normal fulfilment flow;
 * anything else (going backwards, or touching cancelled/refunded/returned
 * orders) has to be done one order at a time.
 */
export function canBulkAdvance(current: OrderStatus, target: OrderStatus) {
  const from = ORDER_STATUS_FLOW.indexOf(current);
  const to = ORDER_STATUS_FLOW.indexOf(target);
  return from >= 0 && to > from;
}

export const BULK_TARGET_STATUSES: OrderStatus[] = ORDER_STATUS_FLOW.slice(1);

/** Orders that don't count towards a customer's spend. */
export const NOT_SPENT_STATUSES: OrderStatus[] = ["CANCELLED", "FAILED", "REFUNDED", "RETURNED"];
