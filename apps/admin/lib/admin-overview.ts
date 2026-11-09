import "server-only";
import { prisma } from "@sellly/database";
import type { OverviewData } from "@/components/overview-data";
import { PLAN_PRICE, PLANS } from "./plans";

/** Platform aggregates only. Individual merchant data retains its existing grant checks. */
export async function getAdminOverview(staff: {
  id: string;
  name: string | null;
  email: string;
}): Promise<OverviewData> {
  const now = new Date();
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(now)
      .map((part) => [part.type, part.value]),
  );
  const today = new Date(
    `${parts.year}-${parts.month}-${parts.day}T00:00:00+05:30`,
  );
  const since = new Date(today.getTime() - 6 * 86400_000);
  const dateKey = (date: Date) => {
    const values = Object.fromEntries(
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
        .formatToParts(date)
        .map((part) => [part.type, part.value]),
    );
    return `${values.year}-${values.month}-${values.day}`;
  };
  const [storeGroups, subscriptions, sales, statuses, activeGrants, latest] =
    await Promise.all([
      prisma.store.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.subscription.groupBy({
        by: ["plan", "status"],
        _count: { _all: true },
      }),
      // Prisma stores createdAt as a UTC timestamp without a timezone. Group it by the IST day.
      prisma.$queryRaw<
        {
          day: string;
          kind: "paid" | "cod" | "other";
          total: number;
          count: number;
        }[]
      >`
      SELECT TO_CHAR((o."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') AS day,
        CASE WHEN p."method"::text = 'COD' THEN 'cod'
             WHEN p."status"::text = 'PAID' THEN 'paid' ELSE 'other' END AS kind,
        COALESCE(SUM(o."total"), 0)::float AS total, COUNT(*)::int AS count
      FROM "orders" o LEFT JOIN "payments" p ON p."orderId" = o.id
      WHERE o."createdAt" >= ${since} AND o."createdAt" <= ${now}
        AND o.status::text NOT IN ('CANCELLED', 'FAILED', 'REFUNDED', 'RETURNED')
      GROUP BY 1, 2 ORDER BY 1, 2`,
      prisma.order.groupBy({
        by: ["status"],
        where: { createdAt: { gte: since, lte: now } },
        _count: { _all: true },
      }),
      prisma.accessRequest.count({
        where: {
          requestedById: staff.id,
          status: "APPROVED",
          expiresAt: { gt: now },
        },
      }),
      prisma.store.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true,
          members: {
            where: { role: "OWNER" },
            take: 1,
            select: { user: { select: { name: true, email: true } } },
          },
        },
      }),
    ]);
  const storeCount = storeGroups.reduce(
    (sum, group) => sum + group._count._all,
    0,
  );
  const countStores = (status: string) =>
    storeGroups.find((group) => group.status === status)?._count._all ?? 0;
  const active = subscriptions.filter((group) => group.status === "ACTIVE");
  const assigned = subscriptions.reduce(
    (sum, group) => sum + group._count._all,
    0,
  );
  const countOrders = (status: string) =>
    statuses.find((group) => group.status === status)?._count._all ?? 0;
  const activity = [
    { label: "Confirmed", count: countOrders("CONFIRMED"), color: "var(--order-confirmed)" },
    { label: "Delivered", count: countOrders("DELIVERED"), color: "var(--order-delivered)" },
    { label: "Shipped", count: countOrders("SHIPPED"), color: "var(--order-shipped)" },
  ];
  const otherOrders = statuses
    .filter(
      (group) =>
        !["CONFIRMED", "DELIVERED", "SHIPPED", "CANCELLED"].includes(
          group.status,
        ),
    )
    .reduce((sum, group) => sum + group._count._all, 0);
  if (otherOrders)
    activity.push({
      label: "Other statuses",
      count: otherOrders,
      color: "var(--order-cancelled)",
    });
  return {
    name: staff.name?.trim().split(/\s+/)[0] || staff.email.split("@")[0],
    sample: false,
    periodLabel: "Last 7 days · IST",
    days: Array.from({ length: 7 }, (_, index) => {
      const date = new Date(since.getTime() + index * 86400_000);
      const key = dateKey(date);
      const row = (kind: string) =>
        sales.find((item) => item.day === key && item.kind === kind);
      return {
        key,
        label: date.toLocaleDateString("en-IN", {
          timeZone: "Asia/Kolkata",
          day: "numeric",
          month: "short",
        }),
        paid: Number(row("paid")?.total ?? 0),
        cod: Number(row("cod")?.total ?? 0),
        other: Number(row("other")?.total ?? 0),
        paidCount: Number(row("paid")?.count ?? 0),
        codCount: Number(row("cod")?.count ?? 0),
        otherCount: Number(row("other")?.count ?? 0),
      };
    }),
    stores: {
      total: storeCount,
      published: countStores("PUBLISHED"),
      draft: countStores("DRAFT"),
      suspended: countStores("SUSPENDED"),
    },
    plans: PLANS.map((plan) => ({
      label: plan[0] + plan.slice(1).toLowerCase(),
      count:
        subscriptions
          .filter((group) => group.plan === plan)
          .reduce((sum, group) => sum + group._count._all, 0) +
        (plan === "FREE" ? Math.max(0, storeCount - assigned) : 0),
    })),
    mrr: active.reduce(
      (sum, group) => sum + PLAN_PRICE[group.plan] * group._count._all,
      0,
    ),
    paidPlans: active
      .filter((group) => PLAN_PRICE[group.plan] > 0)
      .reduce((sum, group) => sum + group._count._all, 0),
    activeGrants,
    orderActivity: activity,
    cancelledOrders: countOrders("CANCELLED"),
    newStores: latest.map((store) => ({
      id: store.id,
      name: store.name,
      owner:
        store.members[0]?.user.name ?? store.members[0]?.user.email ?? null,
      status: store.status,
      joined: store.createdAt.toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "short",
      }),
    })),
  };
}
