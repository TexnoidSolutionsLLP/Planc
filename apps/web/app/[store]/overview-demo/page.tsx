import Link from "next/link";
import { ArrowRight, ChevronDown, Download, ExternalLink, FlaskConical, Layers, Radio, Store as StoreIcon } from "lucide-react";
import { prisma } from "@sellly/database";
import { Badge, Card, CardHeader, CardTitle, buttonVariants, cn } from "@sellly/ui";
import { requireStore } from "@/lib/session";
import { orderStatusLabel, orderStatusVariant } from "@/lib/order-status";
import { CopyLinkButton } from "../_components/copy-link-button";
import { buildSampleData } from "./_lib/sample-data";
import { ChannelIcon } from "./_components/channel-icon";
import { Delta } from "./_components/delta";
import { SalesTrendChart } from "./_components/sales-trend-chart";
import { ProductPerformanceTable } from "./_components/product-performance-table";

/**
 * Overview redesign preview. Lives beside the real /overview page and does not
 * replace it. Store identity, products and setup progress are real; every
 * metric comes from ./_lib/sample-data.ts.
 */

const RANGES = [
  { key: "7", label: "Last 7 days" },
  { key: "30", label: "Last 30 days" },
  { key: "90", label: "Last 90 days" },
];

const money = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const compact = (n: number) => (n >= 100_000 ? `₹${(n / 100_000).toFixed(2)}L` : money(n));

function timeAgo(minutes: number) {
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.round(minutes / 60)}h ago`;
}

export default async function OverviewDemoPage({
  params,
  searchParams,
}: {
  params: { store: string };
  searchParams: { range?: string };
}) {
  const { store } = await requireStore(params.store);
  const days = ["7", "30", "90"].includes(searchParams.range ?? "") ? Number(searchParams.range) : 30;

  const [products, settings, paymentConnection, orderCount] = await Promise.all([
    prisma.product.findMany({ where: { storeId: store.id }, select: { name: true }, orderBy: { createdAt: "asc" }, take: 7 }),
    prisma.storeSettings.findUnique({ where: { storeId: store.id } }),
    prisma.paymentConnection.findFirst({ where: { storeId: store.id, isActive: true } }),
    prisma.order.count({ where: { storeId: store.id } }),
  ]);

  const data = buildSampleData(
    days,
    products.map((p) => p.name)
  );
  const storefrontUrl = process.env.STOREFRONT_URL ?? "http://localhost:3001";
  const storeUrl = `${storefrontUrl}/${store.slug}`;

  const checklist = [
    { done: products.length > 0, label: "Add a product", href: `/${store.slug}/products/new` },
    { done: store.status === "PUBLISHED", label: "Publish store", href: `/${store.slug}/settings` },
    { done: Boolean(settings?.codEnabled || paymentConnection), label: "Set up payments", href: `/${store.slug}/settings` },
    { done: orderCount > 0, label: "Get your first order", href: storeUrl },
  ];
  const doneCount = checklist.filter((c) => c.done).length;
  const nextStep = checklist.find((c) => !c.done);

  const { kpis } = data;
  const kpiItems = [
    { label: "Revenue", value: compact(kpis.revenue.value), change: kpis.revenue.change, bar: "bg-brand" },
    { label: "Orders", value: kpis.orders.value.toLocaleString("en-IN"), change: kpis.orders.change, bar: "bg-success" },
    { label: "Avg. order value", value: money(kpis.aov.value), change: kpis.aov.change, bar: "bg-warning" },
    { label: "Conversion rate", value: `${kpis.conversion.value.toFixed(1)}%`, change: kpis.conversion.change, suffix: " pts", bar: "bg-brand" },
    { label: "Store visits", value: kpis.visits.value.toLocaleString("en-IN"), change: kpis.visits.change, bar: "bg-success" },
  ];
  const totalVisits = kpis.visits.value;
  const maxCollectionOrders = Math.max(...data.collections.map((c) => c.orders));

  return (
    <div className="space-y-5">
      {/* Preview notice */}
      <div className="flex flex-col gap-2 rounded-md border border-brand-border bg-brand-soft px-4 py-2.5 text-small text-brand sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 shrink-0" />
          <span>
            <span className="font-semibold">Redesign preview.</span> Metrics on this page are sample data.
          </span>
        </p>
        <Link href={`/${store.slug}/overview`} className="inline-flex items-center gap-1 font-medium hover:text-brand-hover">
          Back to current Overview <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-title text-primary">Overview</h1>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={buttonVariants({ variant: "ghost" })}>
            <Download className="h-4 w-4" /> Export
          </button>
          <CopyLinkButton url={storeUrl} label="Copy link" />
          <a href={storeUrl} target="_blank" rel="noreferrer" className={buttonVariants({})}>
            View store <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-3 border-b border-border pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-small">
          <span className="inline-flex items-center gap-2 font-medium text-primary">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-brand text-[11px] font-bold text-white">{store.name.charAt(0)}</span>
            {store.name}
            <ChevronDown className="h-3.5 w-3.5 text-subtle" />
          </span>
          <span className="hidden h-4 w-px bg-border sm:block" aria-hidden="true" />
          <span className="inline-flex items-center gap-1.5 text-muted">
            <Radio className="h-3.5 w-3.5" /> Channel: <span className="font-medium text-primary">All channels</span>
            <ChevronDown className="h-3.5 w-3.5 text-subtle" />
          </span>
          <span className="inline-flex items-center gap-1.5 text-muted">
            <Layers className="h-3.5 w-3.5" /> Collection: <span className="font-medium text-primary">All</span>
            <ChevronDown className="h-3.5 w-3.5 text-subtle" />
          </span>
        </div>
        <div role="group" aria-label="Period" className="inline-flex w-fit rounded border border-border bg-surface p-0.5">
          {RANGES.map((r) => (
            <Link
              key={r.key}
              href={`?range=${r.key}`}
              aria-current={String(days) === r.key ? "true" : undefined}
              className={cn(
                "rounded-[6px] px-3 py-1.5 text-[13px] font-medium transition-colors duration-150",
                String(days) === r.key ? "bg-secondary text-primary" : "text-muted hover:text-primary"
              )}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      {/* KPI strip */}
      <Card className="overflow-hidden p-0 sm:p-0">
        <div className="grid grid-cols-2 gap-px bg-border md:grid-cols-3 2xl:grid-cols-6">
          {kpiItems.map((k) => (
            <div key={k.label} className="bg-surface px-5 py-4">
              <p className="flex items-center gap-2 text-small text-muted">
                <span className={cn("h-3.5 w-[3px] rounded-full", k.bar)} aria-hidden="true" />
                {k.label}
              </p>
              <div className="mt-2.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="tabular text-[24px] font-semibold leading-none tracking-tight text-primary">{k.value}</span>
                <Delta value={k.change} suffix={k.suffix ?? "%"} />
              </div>
            </div>
          ))}
          <div className="bg-surface px-5 py-4">
            <p className="flex items-center gap-2 text-small text-muted">
              <span className="h-3.5 w-[3px] rounded-full bg-error" aria-hidden="true" />
              Abandoned carts
            </p>
            <div className="mt-2.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="tabular text-[24px] font-semibold leading-none tracking-tight text-primary">{kpis.abandoned.value}</span>
              <Link href={`/${store.slug}/customers`} className="inline-flex items-center gap-0.5 text-caption font-semibold text-warning hover:underline">
                Recover <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <p className="mt-1.5 text-caption text-subtle">{compact(kpis.abandoned.lost)} left in carts</p>
          </div>
        </div>
      </Card>

      {/* Setup progress (only while incomplete) */}
      {nextStep && (
        <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-4">
          <div className="flex items-center gap-3 sm:w-56">
            <StoreIcon className="h-4 w-4 text-brand" />
            <p className="text-small font-medium text-primary">
              Store setup <span className="text-muted">· {doneCount} of {checklist.length}</span>
            </p>
          </div>
          <div className="flex flex-1 gap-1.5" aria-hidden="true">
            {checklist.map((c) => (
              <span key={c.label} title={c.label} className={cn("h-1.5 flex-1 rounded-full", c.done ? "bg-success" : "bg-secondary")} />
            ))}
          </div>
          <a href={nextStep.href} className="inline-flex items-center gap-1 text-small font-medium text-brand hover:text-brand-hover">
            Next: {nextStep.label} <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </Card>
      )}

      {/* Insight row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="mb-2">
            <div>
              <CardTitle>Sales trend</CardTitle>
              <p className="mt-0.5 text-small text-muted">Revenue by channel</p>
            </div>
          </CardHeader>
          <SalesTrendChart data={data.trend} />
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <div>
              <CardTitle>Top collections</CardTitle>
              <p className="mt-0.5 text-small text-muted">Orders this period</p>
            </div>
            <Link href={`/${store.slug}/collections`} className="text-small font-medium text-brand hover:text-brand-hover">
              View all
            </Link>
          </CardHeader>
          <ul className="flex-1 divide-y divide-border">
            {data.collections.map((c) => (
              <li key={c.name} className="flex items-center gap-3 py-2.5 text-small">
                <span className="w-24 shrink-0 truncate text-primary">{c.name}</span>
                <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-secondary" aria-hidden="true">
                  <span className="absolute inset-y-0 left-0 rounded-full bg-brand/70" style={{ width: `${(c.orders / maxCollectionOrders) * 100}%` }} />
                </span>
                <span className="tabular w-8 text-right font-medium text-primary">{c.orders}</span>
                <Delta value={c.change} className="w-16 justify-end" />
              </li>
            ))}
          </ul>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="mb-1">
            <CardTitle>Traffic sources</CardTitle>
          </CardHeader>
          <p className="flex items-baseline gap-2">
            <span className="tabular text-[26px] font-semibold tracking-tight text-primary">{totalVisits.toLocaleString("en-IN")}</span>
            <span className="text-small text-muted">store visits</span>
          </p>
          <ul className="mt-4 flex-1 space-y-3">
            {data.sources.map((s) => (
              <li key={s.key} className="flex items-center gap-3 text-small">
                <ChannelIcon channel={s.key} />
                <span className="w-20 shrink-0 text-primary">{s.label}</span>
                <span className="relative flex h-7 flex-1 items-center overflow-hidden rounded bg-secondary">
                  <span
                    className={cn(
                      "absolute inset-y-0 left-0 border-r-2",
                      s.key === "instagram" && "border-brand bg-brand-soft",
                      s.key === "whatsapp" && "border-success bg-success-soft",
                      s.key === "direct" && "border-warning bg-warning-soft"
                    )}
                    style={{ width: `${s.share}%` }}
                  />
                  <span className="tabular relative w-full text-center text-caption font-semibold text-primary">{s.share}%</span>
                </span>
              </li>
            ))}
          </ul>
          <Link href={`/${store.slug}/analytics`} className={cn(buttonVariants({ variant: "secondary" }), "mt-4 w-full justify-center")}>
            View analytics
          </Link>
        </Card>
      </div>

      {/* Product leaderboard */}
      <ProductPerformanceTable rows={data.products} storeSlug={store.slug} />

      {/* Recent orders + funnel */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-0 sm:p-0 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6">
            <h2 className="text-[15px] font-semibold tracking-tight text-primary">Recent orders</h2>
            <Link href={`/${store.slug}/orders`} className="text-small font-medium text-brand hover:text-brand-hover">
              View all
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {data.recentOrders.map((o) => (
              <li key={o.number} className="flex items-center gap-3 px-5 py-3 text-small sm:px-6">
                <ChannelIcon channel={o.source} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-primary">
                    #{o.number} <span className="font-normal text-muted">· {o.customer}</span>
                  </p>
                  <p className="text-caption text-subtle">{timeAgo(o.minutesAgo)}</p>
                </div>
                <Badge variant={orderStatusVariant(o.status)}>{orderStatusLabel(o.status)}</Badge>
                <span className="tabular w-20 text-right font-medium text-primary">{money(o.total)}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Conversion funnel</CardTitle>
              <p className="mt-0.5 text-small text-muted">{kpis.conversion.value.toFixed(1)}% of visits become orders</p>
            </div>
          </CardHeader>
          <ol className="space-y-3">
            {data.funnel.map((f) => {
              const pct = (f.value / data.funnel[0].value) * 100;
              return (
                <li key={f.label} className="text-small">
                  <div className="mb-1 flex justify-between">
                    <span className="text-muted">{f.label}</span>
                    <span className="tabular font-medium text-primary">
                      {f.value.toLocaleString("en-IN")} <span className="font-normal text-subtle">· {pct.toFixed(pct < 10 ? 1 : 0)}%</span>
                    </span>
                  </div>
                  <span className="block h-1.5 overflow-hidden rounded-full bg-secondary" aria-hidden="true">
                    <span className="block h-full rounded-full bg-brand" style={{ width: `${Math.max(pct, 2)}%` }} />
                  </span>
                </li>
              );
            })}
          </ol>
        </Card>
      </div>
    </div>
  );
}
