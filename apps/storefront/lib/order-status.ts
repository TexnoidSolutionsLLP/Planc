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
