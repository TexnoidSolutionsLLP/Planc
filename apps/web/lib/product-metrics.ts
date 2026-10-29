export const LOW_STOCK_THRESHOLD = 5;

export type StockState = "untracked" | "out" | "low" | "ok";

export function stockState(p: { trackInventory: boolean; inventoryQty: number }, threshold = LOW_STOCK_THRESHOLD): StockState {
  if (!p.trackInventory) return "untracked";
  if (p.inventoryQty <= 0) return "out";
  if (p.inventoryQty <= threshold) return "low";
  return "ok";
}

/**
 * Per-unit profit and margin at list price, before discounts, shipping,
 * payment fees and refunds. Returns nulls when no cost is recorded, so the
 * UI shows "—" rather than treating revenue as profit.
 */
export function unitEconomics(price: number, cost: number | null | undefined) {
  if (cost == null || !Number.isFinite(cost) || !Number.isFinite(price) || price <= 0) return { profit: null, margin: null };
  const profit = price - cost;
  return { profit, margin: profit / price };
}

/**
 * Order statuses whose items count as sold: confirmed onwards. Pending
 * (unconfirmed, often unpaid COD) and cancelled, failed, refunded or returned
 * orders are left out.
 */
export const SOLD_ORDER_STATUSES = ["CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"] as const;
