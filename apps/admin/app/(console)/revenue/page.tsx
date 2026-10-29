import Link from "next/link";
import { prisma, storesWithActiveGrant } from "@sellly/database";
import { Card, CardDescription, CardHeader, CardTitle, Table, Thead, Th, Tr, Td } from "@sellly/ui";
import { requireAdmin } from "@/lib/require-admin";
import { PLANS, PLAN_PRICE, PLAN_RANK, inr } from "@/lib/plans";

const EXCLUDED = ["CANCELLED", "FAILED", "REFUNDED", "RETURNED"] as const;

export default async function RevenuePage() {
  const staff = await requireAdmin();
  const since = new Date();
  since.setUTCMonth(since.getUTCMonth() - 11, 1);
  since.setUTCHours(0, 0, 0, 0);

  const [subscriptionGroups, storeCount, gmvAll, monthly, topByOrders, planChanges, viewable] = await Promise.all([
    prisma.subscription.groupBy({ by: ["plan", "status"], _count: true }),
    prisma.store.count(),
    prisma.order.aggregate({ where: { status: { notIn: [...EXCLUDED] } }, _sum: { total: true }, _count: true }),
    prisma.$queryRaw<{ month: Date; gmv: number; orders: number }[]>`
      SELECT date_trunc('month', "createdAt") AS month, COALESCE(SUM("total"), 0)::float AS gmv, COUNT(*)::int AS orders
      FROM "orders"
      WHERE "status"::text NOT IN ('CANCELLED', 'FAILED', 'REFUNDED', 'RETURNED') AND "createdAt" >= ${since}
      GROUP BY 1 ORDER BY 1`,
    prisma.order.groupBy({ by: ["storeId"], where: { status: { notIn: [...EXCLUDED] } }, _count: { _all: true }, orderBy: { _count: { storeId: "desc" } }, take: 10 }),
    prisma.auditLog.findMany({ where: { action: "support.plan_changed" }, include: { store: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" }, take: 50 }),
    storesWithActiveGrant(staff.id, "STORE", "view"),
  ]);

  // MRR: list price of every paid plan whose subscription is ACTIVE.
  const active = subscriptionGroups.filter((g) => g.status === "ACTIVE");
  const mrr = active.reduce((sum, g) => sum + (PLAN_PRICE[g.plan] ?? 0) * g._count, 0);
  const pastDue = subscriptionGroups.filter((g) => g.status === "PAST_DUE");
  const pastDueValue = pastDue.reduce((sum, g) => sum + (PLAN_PRICE[g.plan] ?? 0) * g._count, 0);
  const cancelled = subscriptionGroups.filter((g) => g.status === "CANCELLED").reduce((n, g) => n + g._count, 0);
  const withSub = subscriptionGroups.reduce((n, g) => n + g._count, 0);
  const planCounts = Object.fromEntries(PLANS.map((p) => [p, active.filter((g) => g.plan === p).reduce((n, g) => n + g._count, 0)]));
  planCounts.FREE += Math.max(0, storeCount - withSub); // stores created before subscriptions existed default to Free

  // Fill empty months so the trend has no gaps.
  const months: { key: string; label: string; gmv: number; orders: number }[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(since);
    d.setUTCMonth(since.getUTCMonth() + i);
    const key = d.toISOString().slice(0, 7);
    const row = monthly.find((m) => new Date(m.month).toISOString().slice(0, 7) === key);
    months.push({ key, label: d.toLocaleDateString("en-IN", { month: "short", year: "2-digit", timeZone: "UTC" }), gmv: row?.gmv ?? 0, orders: row?.orders ?? 0 });
  }
  const maxGmv = Math.max(1, ...months.map((m) => m.gmv));

  const topStores = await prisma.store.findMany({ where: { id: { in: topByOrders.map((t) => t.storeId) } }, select: { id: true, name: true } });
  const viewableSet = new Set(viewable);
  const topSales = viewable.length
    ? await prisma.order.groupBy({ by: ["storeId"], where: { storeId: { in: topByOrders.map((t) => t.storeId).filter((id) => viewableSet.has(id)) }, status: { notIn: [...EXCLUDED] } }, _sum: { total: true } })
    : [];

  const downgrades = planChanges.filter((c) => {
    const m = c.metadata as { from?: string; to?: string } | null;
    return m?.from && m?.to && PLAN_RANK[m.to] < PLAN_RANK[m.from];
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-title text-primary">Revenue</h1>
        <p className="text-body text-muted">Sellly&apos;s subscription revenue and merchants&apos; sales are separate — store sales are not Sellly revenue.</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-h3 text-primary">Sellly subscription revenue</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <p className="text-small text-muted">Monthly recurring revenue</p>
            <p className="mt-1 text-h2 text-primary">{inr(mrr)}</p>
            <p className="mt-1 text-caption text-muted">List price of active paid plans. Billing isn&apos;t automated yet, so this isn&apos;t collected cash.</p>
          </Card>
          <Card>
            <p className="text-small text-muted">Past due</p>
            <p className="mt-1 text-h2 text-primary">{inr(pastDueValue)}</p>
            <p className="mt-1 text-caption text-muted">{pastDue.reduce((n, g) => n + g._count, 0)} subscription(s), not counted in MRR</p>
          </Card>
          <Card>
            <p className="text-small text-muted">Cancelled subscriptions</p>
            <p className="mt-1 text-h2 text-primary">{cancelled}</p>
            <p className="mt-1 text-caption text-muted">Current count; cancellation dates aren&apos;t recorded.</p>
          </Card>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Plan distribution</CardTitle>
              <CardDescription>Active subscriptions across {storeCount} stores</CardDescription>
            </CardHeader>
            <ul className="space-y-2">
              {PLANS.map((p) => (
                <li key={p} className="text-small">
                  <div className="flex justify-between">
                    <span>
                      {p} <span className="text-muted">· {inr(PLAN_PRICE[p])}/mo</span>
                    </span>
                    <span className="tabular">{planCounts[p]}</span>
                  </div>
                  <div className="mt-1 h-2 rounded bg-secondary">
                    <div className="h-2 rounded bg-brand" style={{ width: `${storeCount ? (planCounts[p] / storeCount) * 100 : 0}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Downgrades</CardTitle>
              <CardDescription>Plan changes made in this admin app. Earlier history wasn&apos;t recorded.</CardDescription>
            </CardHeader>
            {downgrades.length === 0 ? (
              <p className="text-small text-muted">None recorded.</p>
            ) : (
              <ul className="space-y-1 text-small">
                {downgrades.map((d) => {
                  const m = d.metadata as { from: string; to: string };
                  return (
                    <li key={d.id} className="flex justify-between gap-2">
                      <span>
                        {d.store?.name ?? "Deleted store"}: {m.from} → {m.to}
                      </span>
                      <span className="text-caption text-muted">{d.createdAt.toLocaleDateString("en-IN")}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
        <p className="text-caption text-muted">A subscription revenue trend isn&apos;t available: past plan and payment history isn&apos;t stored, only each store&apos;s current plan.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-h3 text-primary">Merchant sales processed (GMV)</h2>
        <Card>
          <p className="text-small text-muted">All time, across all stores</p>
          <p className="mt-1 text-h2 text-primary">{inr(Number(gmvAll._sum.total ?? 0))}</p>
          <p className="mt-1 text-caption text-muted">{gmvAll._count.toLocaleString("en-IN")} orders, excluding cancelled, failed, refunded and returned. This money belongs to merchants.</p>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Monthly trend</CardTitle>
            <CardDescription>Last 12 months, all stores combined</CardDescription>
          </CardHeader>
          <div className="flex h-40 items-end gap-1.5" role="img" aria-label="Monthly merchant sales for the last 12 months">
            {months.map((m) => (
              <div key={m.key} className="flex h-full flex-1 flex-col justify-end" title={`${m.label}: ${inr(m.gmv)} · ${m.orders} orders`}>
                <div className="rounded-t bg-brand/80" style={{ height: `${(m.gmv / maxGmv) * 100}%`, minHeight: m.gmv > 0 ? 2 : 0 }} />
              </div>
            ))}
          </div>
          <div className="mt-1 flex gap-1.5">
            {months.map((m) => (
              <span key={m.key} className="flex-1 text-center text-[10px] text-muted">
                {m.label}
              </span>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Highest-performing stores</CardTitle>
            <CardDescription>By order count, excluding cancelled, failed, refunded and returned. A store&apos;s sales figure shows only with its owner&apos;s approval.</CardDescription>
          </CardHeader>
          <Table>
            <Thead>
              <Tr>
                <Th>Store</Th>
                <Th>Orders</Th>
                <Th>Sales</Th>
              </Tr>
            </Thead>
            <tbody>
              {topByOrders.map((t) => {
                const sales = topSales.find((s) => s.storeId === t.storeId);
                return (
                  <Tr key={t.storeId}>
                    <Td>
                      <Link href={`/stores/${t.storeId}`} className="hover:underline">
                        {topStores.find((s) => s.id === t.storeId)?.name ?? "—"}
                      </Link>
                    </Td>
                    <Td className="tabular">{t._count._all}</Td>
                    <Td className="tabular">{sales ? inr(Number(sales._sum.total ?? 0)) : <span className="text-caption text-muted">Needs approval</span>}</Td>
                  </Tr>
                );
              })}
              {topByOrders.length === 0 && (
                <Tr>
                  <Td colSpan={3} className="text-muted">
                    No orders yet.
                  </Td>
                </Tr>
              )}
            </tbody>
          </Table>
        </Card>
      </section>
    </div>
  );
}
