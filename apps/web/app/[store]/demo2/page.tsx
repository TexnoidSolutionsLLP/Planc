import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ClipboardList,
  FlaskConical,
  PackageCheck,
  PackageOpen,
  Plus,
  ShoppingCart,
  Target,
  Truck,
} from "lucide-react";
import { prisma } from "@sellly/database";
import { Badge, Card, buttonVariants, cn } from "@sellly/ui";
import { requireStore, requireUser } from "@/lib/session";
import { orderStatusLabel, orderStatusVariant } from "@/lib/order-status";
import { CopyLinkButton } from "../_components/copy-link-button";
import { buildSampleData } from "../overview-demo/_lib/sample-data";
import { ChannelIcon } from "../overview-demo/_components/channel-icon";
import { ChannelDonut, HeroRevenueChart, Sparkline } from "./_components/charts";
import { DONUT_COLORS } from "./_components/palette";

/**
 * Demo 2 — white & red Overview concept. The red palette is scoped to this page
 * by remapping the brand tokens on `.demo2-theme`; the dashboard shell and every
 * other page keep the default palette. Metrics are sample data.
 */

const THEME_CSS = `
.demo2-theme {
  --color-primary: 220 38 38;
  --color-primary-hover: 185 28 28;
  --color-primary-deep: 127 29 29;
  --color-primary-soft: 254 242 242;
  --color-primary-border: 254 202 202;
  --color-surface-2: 250 245 245;
}
.dark .demo2-theme {
  --color-primary: 248 113 113;
  --color-primary-hover: 252 165 165;
  --color-primary-deep: 254 202 202;
  --color-primary-soft: 60 14 14;
  --color-primary-border: 127 29 29;
  --color-surface-2: 30 22 22;
}`;

const RANGES = [
  { key: "7", label: "7D" },
  { key: "30", label: "30D" },
  { key: "90", label: "90D" },
];

const money = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const compact = (n: number) => (n >= 100_000 ? `₹${(n / 100_000).toFixed(2)}L` : money(n));

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

function timeAgo(minutes: number) {
  return minutes < 60 ? `${minutes}m ago` : `${Math.round(minutes / 60)}h ago`;
}

/** Up = green, down = neutral. Red is the brand here, so it never signals "bad". */
function Change({ value, suffix = "%" }: { value: number; suffix?: string }) {
  const up = value >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "tabular inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-caption font-semibold",
        up ? "bg-success-soft text-success" : "bg-secondary text-muted"
      )}
    >
      <Icon className="h-3 w-3" aria-label={up ? "Up" : "Down"} />
      {up ? "+" : "−"}
      {Math.abs(value).toFixed(1)}
      {suffix}
    </span>
  );
}

export default async function Demo2Page({ params, searchParams }: { params: { store: string }; searchParams: { range?: string } }) {
  const { store } = await requireStore(params.store);
  const user = await requireUser();
  const days = ["7", "30", "90"].includes(searchParams.range ?? "") ? Number(searchParams.range) : 30;

  const products = await prisma.product.findMany({ where: { storeId: store.id }, select: { name: true }, orderBy: { createdAt: "asc" }, take: 7 });
  const data = buildSampleData(
    days,
    products.map((p) => p.name)
  );
  const { kpis } = data;

  const storefrontUrl = process.env.STOREFRONT_URL ?? "http://localhost:3001";
  const storeUrl = `${storefrontUrl}/${store.slug}`;
  const firstName = (user.name ?? user.email.split("@")[0]).split(" ")[0];

  const revenueSeries = data.trend.map((d) => ({ date: d.date, value: d.instagram + d.whatsapp + d.direct }));
  const totals = revenueSeries.map((d) => d.value);
  const goal = Math.round((kpis.revenue.value * 1.35) / 10_000) * 10_000;
  const goalPct = Math.min(100, Math.round((kpis.revenue.value / goal) * 100));

  const kpiCards = [
    { id: "orders", label: "Orders", value: kpis.orders.value.toLocaleString("en-IN"), change: kpis.orders.change, series: data.trend.map((d) => d.instagram) },
    { id: "aov", label: "Avg. order value", value: money(kpis.aov.value), change: kpis.aov.change, series: data.trend.map((d) => d.whatsapp) },
    { id: "conv", label: "Conversion", value: `${kpis.conversion.value.toFixed(1)}%`, change: kpis.conversion.change, suffix: " pts", series: data.trend.map((d) => d.direct) },
    { id: "visits", label: "Store visits", value: kpis.visits.value.toLocaleString("en-IN"), change: kpis.visits.change, series: totals },
  ];

  const o = kpis.orders.value;
  const pipeline = [
    { label: "Pending", count: Math.round(o * 0.08), Icon: ClipboardList, href: "orders?status=PENDING" },
    { label: "To pack", count: Math.round(o * 0.12), Icon: PackageOpen, href: "orders?status=CONFIRMED" },
    { label: "Shipped", count: Math.round(o * 0.21), Icon: Truck, href: "orders?status=SHIPPED" },
    { label: "Delivered", count: Math.round(o * 0.59), Icon: PackageCheck, href: "orders?status=DELIVERED" },
  ];

  const lowStock = data.products.filter((p) => p.stock < 15);
  const attention = [
    { tone: "red", Icon: ShoppingCart, title: `${kpis.abandoned.value} abandoned carts`, body: `${compact(kpis.abandoned.lost)} waiting — send a WhatsApp reminder.`, cta: "Recover", href: "customers" },
    { tone: "red", Icon: ClipboardList, title: `${pipeline[0].count} orders awaiting confirmation`, body: "Confirm within 24h to keep delivery promises.", cta: "Review", href: "orders" },
    ...(lowStock.length
      ? [{ tone: "amber", Icon: AlertTriangle, title: `${lowStock.length} product${lowStock.length > 1 ? "s" : ""} low on stock`, body: lowStock.map((p) => p.name).slice(0, 2).join(", "), cta: "Restock", href: "products" }]
      : []),
  ];

  const topProducts = data.products.slice(0, 5);
  const maxRevenue = topProducts[0]?.revenue ?? 1;

  return (
    <div className="demo2-theme">
      <style dangerouslySetInnerHTML={{ __html: THEME_CSS }} />

      <div className="space-y-5">
        {/* Preview notice */}
        <div className="flex flex-col gap-1 text-small sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-muted">
            <FlaskConical className="h-4 w-4 text-brand" />
            <span>
              <span className="font-semibold text-primary">Demo 2</span> · sample data
            </span>
          </p>
          <div className="flex gap-4">
            <Link href={`/${store.slug}/overview-demo`} className="font-medium text-muted hover:text-brand">
              Demo 1
            </Link>
            <Link href={`/${store.slug}/overview`} className="font-medium text-muted hover:text-brand">
              Current Overview
            </Link>
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-small font-medium text-brand">{store.name}</p>
            <h1 className="mt-1 text-title text-primary">
              {greeting()}, {firstName}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div role="group" aria-label="Period" className="inline-flex rounded-full border border-border bg-surface p-1">
              {RANGES.map((r) => (
                <Link
                  key={r.key}
                  href={`?range=${r.key}`}
                  aria-current={String(days) === r.key ? "true" : undefined}
                  className={cn(
                    "rounded-full px-3.5 py-1 text-[13px] font-semibold transition-colors duration-150",
                    String(days) === r.key ? "bg-brand text-white shadow-sm" : "text-muted hover:text-primary"
                  )}
                >
                  {r.label}
                </Link>
              ))}
            </div>
            <CopyLinkButton url={storeUrl} label="Share store" />
            <Link href={`/${store.slug}/products/new`} className={buttonVariants({})}>
              <Plus className="h-4 w-4" /> Add product
            </Link>
          </div>
        </div>

        {/* Hero: revenue + goal */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="relative overflow-hidden lg:col-span-2">
            <span className="absolute inset-x-0 top-0 h-1 bg-brand" aria-hidden="true" />
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-small text-muted">Revenue · last {days} days</p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <span className="tabular text-[40px] font-semibold leading-none tracking-tight text-primary">{money(kpis.revenue.value)}</span>
                  <Change value={kpis.revenue.change} />
                </div>
                <p className="mt-2 text-small text-muted">vs previous {days} days</p>
              </div>
              <Link href={`/${store.slug}/analytics`} className="inline-flex items-center gap-1 text-small font-semibold text-brand hover:text-brand-hover">
                Full report <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="mt-4">
              <HeroRevenueChart data={revenueSeries} />
            </div>
          </Card>

          <Card className="flex flex-col bg-brand text-white" style={{ borderColor: "transparent" }}>
            <div className="flex items-center justify-between">
              <p className="inline-flex items-center gap-2 text-small font-medium text-white/80">
                <Target className="h-4 w-4" /> Monthly goal
              </p>
              <span className="rounded-full bg-white/15 px-2 py-0.5 text-caption font-semibold">{goalPct}%</span>
            </div>
            <p className="tabular mt-5 text-[32px] font-semibold leading-none tracking-tight">{compact(kpis.revenue.value)}</p>
            <p className="mt-1.5 text-small text-white/75">of {compact(goal)} target</p>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/20" role="progressbar" aria-valuenow={goalPct} aria-valuemin={0} aria-valuemax={100} aria-label="Goal progress">
              <div className="h-full rounded-full bg-white" style={{ width: `${goalPct}%` }} />
            </div>
            <p className="mt-auto pt-6 text-small text-white/85">
              <span className="font-semibold text-white">{compact(goal - kpis.revenue.value)}</span> to go — about {Math.ceil((goal - kpis.revenue.value) / kpis.aov.value)} more
              orders at your average basket.
            </p>
          </Card>
        </div>

        {/* KPI cards with sparklines */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
          {kpiCards.map((k) => (
            <Card key={k.id} className="flex items-end justify-between gap-3 p-5 transition-shadow duration-200 hover:shadow-md sm:p-5">
              <div className="min-w-0">
                <p className="text-small text-muted">{k.label}</p>
                <p className="tabular mt-2 text-[26px] font-semibold leading-none tracking-tight text-primary">{k.value}</p>
                <div className="mt-2.5">
                  <Change value={k.change} suffix={k.suffix} />
                </div>
              </div>
              <Sparkline values={k.series} id={k.id} />
            </Card>
          ))}
        </div>

        {/* Pipeline + attention */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-[15px] font-semibold tracking-tight text-primary">Order pipeline</h2>
                <p className="text-small text-muted">Where this period&apos;s {o} orders are right now</p>
              </div>
              <Link href={`/${store.slug}/orders`} className="text-small font-semibold text-brand hover:text-brand-hover">
                All orders
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {pipeline.map((p, i) => (
                <Link
                  key={p.label}
                  href={`/${store.slug}/${p.href}`}
                  className={cn(
                    "group rounded-md border p-4 transition-colors duration-150",
                    i < 2 ? "border-brand-border bg-brand-soft hover:border-brand" : "border-border hover:border-border-strong hover:bg-secondary"
                  )}
                >
                  <p.Icon className={cn("h-5 w-5", i < 2 ? "text-brand" : "text-subtle")} />
                  <p className="tabular mt-3 text-[24px] font-semibold leading-none text-primary">{p.count}</p>
                  <p className="mt-1.5 flex items-center justify-between text-small text-muted">
                    {p.label}
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                  </p>
                </Link>
              ))}
            </div>
            <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-secondary" aria-hidden="true">
              {pipeline.map((p, i) => (
                <span key={p.label} className={i < 2 ? "bg-brand" : i === 2 ? "bg-brand/40" : "bg-border-strong"} style={{ width: `${(p.count / o) * 100}%` }} />
              ))}
            </div>
          </Card>

          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[15px] font-semibold tracking-tight text-primary">Needs attention</h2>
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-caption font-semibold text-white">{attention.length}</span>
            </div>
            <ul className="space-y-2.5">
              {attention.map((a) => (
                <li key={a.title} className="flex gap-3 rounded-md border border-border p-3">
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      a.tone === "red" ? "bg-brand-soft text-brand" : "bg-warning-soft text-warning"
                    )}
                  >
                    <a.Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-small font-semibold text-primary">{a.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-caption font-normal text-muted">{a.body}</p>
                  </div>
                  <Link href={`/${store.slug}/${a.href}`} className="self-center text-caption font-semibold text-brand hover:text-brand-hover">
                    {a.cta}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Products, channels, orders */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[15px] font-semibold tracking-tight text-primary">Best sellers</h2>
              <Link href={`/${store.slug}/products`} className="text-small font-semibold text-brand hover:text-brand-hover">
                Products
              </Link>
            </div>
            <ol className="space-y-4">
              {topProducts.map((p, i) => (
                <li key={p.id}>
                  <div className="flex items-center gap-3 text-small">
                    <span
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-caption font-semibold",
                        i === 0 ? "bg-brand text-white" : "bg-secondary text-muted"
                      )}
                    >
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium text-primary">{p.name}</span>
                    <span className="tabular font-semibold text-primary">{compact(p.revenue)}</span>
                  </div>
                  <div className="ml-10 mt-1.5 flex items-center gap-2">
                    <span className="h-1 flex-1 overflow-hidden rounded-full bg-secondary" aria-hidden="true">
                      <span className="block h-full rounded-full bg-brand" style={{ width: `${(p.revenue / maxRevenue) * 100}%` }} />
                    </span>
                    <span className="tabular w-14 text-right text-caption font-normal text-subtle">{p.orders} sold</span>
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          <Card>
            <h2 className="mb-2 text-[15px] font-semibold tracking-tight text-primary">Sales by channel</h2>
            <ChannelDonut data={data.sources} centerValue={o.toLocaleString("en-IN")} centerLabel="orders" />
            <ul className="mt-4 space-y-2.5">
              {data.sources.map((s, i) => (
                <li key={s.key} className="flex items-center gap-3 text-small">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: DONUT_COLORS[i] }} aria-hidden="true" />
                  <span className="flex-1 text-primary">{s.label}</span>
                  <span className="tabular text-muted">{Math.round((o * s.share) / 100)} orders</span>
                  <span className="tabular w-10 text-right font-semibold text-primary">{s.share}%</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-0 sm:p-0">
            <div className="flex items-center justify-between px-5 pb-2 pt-5 sm:px-6 sm:pt-6">
              <h2 className="text-[15px] font-semibold tracking-tight text-primary">Latest orders</h2>
              <span className="inline-flex items-center gap-1.5 text-caption text-success">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60 motion-reduce:animate-none" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                </span>
                Live
              </span>
            </div>
            <ul className="divide-y divide-border">
              {data.recentOrders.map((r) => (
                <li key={r.number}>
                  <Link href={`/${store.slug}/orders`} className="flex items-center gap-3 px-5 py-3 text-small transition-colors hover:bg-secondary sm:px-6">
                    <ChannelIcon channel={r.source} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-primary">{r.customer}</p>
                      <p className="text-caption font-normal text-subtle">
                        #{r.number} · {timeAgo(r.minutesAgo)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="tabular font-semibold text-primary">{money(r.total)}</p>
                      <Badge variant={orderStatusVariant(r.status)} className="mt-0.5">
                        {orderStatusLabel(r.status)}
                      </Badge>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <p className="flex items-center justify-center gap-1.5 pb-2 text-caption font-normal text-subtle">
          <CheckCircle2 className="h-3.5 w-3.5" /> All figures on this page are sample data for design review.
        </p>
      </div>
    </div>
  );
}
