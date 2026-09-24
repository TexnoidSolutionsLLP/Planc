import { prisma } from "@sellly/database";

export type AnalyticsEventType = "page_view" | "add_to_cart" | "checkout_started" | "order_placed";

export function trackEvent(storeId: string, type: AnalyticsEventType, metadata?: Record<string, unknown>) {
  return prisma.analyticsEvent.create({ data: { storeId, type, metadata: metadata as any } });
}

export async function getStoreOverview(storeId: string, since: Date, until?: Date) {
  const range = until ? { gte: since, lt: until } : { gte: since };
  const [orders, revenueAgg, customers, refunds] = await Promise.all([
    prisma.order.count({ where: { storeId, createdAt: range, status: { notIn: ["CANCELLED", "FAILED"] } } }),
    prisma.order.aggregate({
      where: { storeId, createdAt: range, status: { notIn: ["CANCELLED", "FAILED"] } },
      _sum: { total: true },
    }),
    prisma.customer.count({ where: { storeId, createdAt: range } }),
    prisma.order.count({ where: { storeId, status: "REFUNDED", createdAt: range } }),
  ]);

  const revenue = Number(revenueAgg._sum.total ?? 0);
  const averageOrderValue = orders > 0 ? revenue / orders : 0;

  return { revenue, orders, customers, averageOrderValue, refunds };
}

export async function getTopProducts(storeId: string, since: Date, limit = 5) {
  const grouped = await prisma.orderItem.groupBy({
    by: ["productId", "title"],
    where: { order: { storeId, createdAt: { gte: since }, status: { notIn: ["CANCELLED", "FAILED"] } } },
    _sum: { quantity: true, price: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });

  return grouped.map((g) => ({
    productId: g.productId,
    title: g.title,
    unitsSold: g._sum.quantity ?? 0,
  }));
}

export async function getConversionFunnel(storeId: string, since: Date) {
  const [pageViews, addToCart, checkoutStarted, ordersPlaced] = await Promise.all([
    prisma.analyticsEvent.count({ where: { storeId, type: "page_view", createdAt: { gte: since } } }),
    prisma.analyticsEvent.count({ where: { storeId, type: "add_to_cart", createdAt: { gte: since } } }),
    prisma.analyticsEvent.count({ where: { storeId, type: "checkout_started", createdAt: { gte: since } } }),
    prisma.analyticsEvent.count({ where: { storeId, type: "order_placed", createdAt: { gte: since } } }),
  ]);

  const conversionRate = pageViews > 0 ? (ordersPlaced / pageViews) * 100 : 0;

  return { pageViews, addToCart, checkoutStarted, ordersPlaced, conversionRate };
}

export async function getRevenueByDay(storeId: string, since: Date) {
  const orders = await prisma.order.findMany({
    where: { storeId, createdAt: { gte: since }, status: { notIn: ["CANCELLED", "FAILED"] } },
    select: { createdAt: true, total: true },
  });

  const byDay = new Map<string, number>();
  for (const o of orders) {
    const key = o.createdAt.toISOString().slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + Number(o.total));
  }

  return Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, revenue]) => ({ date, revenue }));
}
