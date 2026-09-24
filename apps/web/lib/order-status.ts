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
