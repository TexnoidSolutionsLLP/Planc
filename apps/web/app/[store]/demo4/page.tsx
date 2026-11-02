import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  FlaskConical,
  Gem,
  Instagram,
  Link2,
  MessageCircle,
  PackageCheck,
  Plus,
  ShoppingBag,
  Share2,
} from "lucide-react";
import { prisma } from "@sellly/database";
import { cn } from "@sellly/ui";
import { requireStore, requireUser } from "@/lib/session";
import { buildSampleData, type Channel } from "../overview-demo/_lib/sample-data";
import { RevenueTrend, Sparkline } from "./_components/charts";

/**
 * Demo 4 — "Emerald & Champagne". A jewel-tone palette for a jewellery store:
 * deep emerald for primary data and actions, champagne gold as the single
 * accent (goal, comparisons, highlights), warm ivory surfaces and navy ink.
 * Layout follows common dashboard guidance: header strip with one date range,
 * 4 KPIs above the fold (each with a comparison), one hero chart, then
 * actionable and supporting sections. Palette is scoped to `.demo4-theme`;
 * metrics are sample data.
 */

const THEME_CSS = `
.demo4-theme {
  --d4-bg: #FAF7F0;
  --d4-surface: #FFFFFF;
  --d4-surface-2: #F4EFE4;
  --d4-border: #E8E1D2;
  --d4-border-strong: #D6CCB6;
  --d4-ink: #1B2A4A;
  --d4-muted: #5B6475;
  --d4-subtle: #8A8F99;
  --d4-primary: #0B6E4F;
  --d4-primary-hover: #085A40;
  --d4-primary-soft: #E4F2EB;
  --d4-gold: #C9A227;
  --d4-gold-text: #8A6A12;
  --d4-gold-soft: #F8EFD6;
  --d4-navy: #1B2A4A;
  --d4-up: #0B6E4F;
  --d4-down: #B42318;
  --d4-down-soft: #FDECEA;
  --d4-warn: #A15C07;
  --d4-warn-soft: #FDF1DC;
  background: var(--d4-bg);
  color: var(--d4-ink);
}
.dark .demo4-theme {
  --d4-bg: #0E1412;
  --d4-surface: #141C19;
  --d4-surface-2: #1A2420;
  --d4-border: #24312C;
  --d4-border-strong: #33443D;
  --d4-ink: #EEF2EF;
  --d4-muted: #A7B4AE;
  --d4-subtle: #7D8A84;
  --d4-primary: #34D399;
  --d4-primary-hover: #6EE7B7;
  --d4-primary-soft: #12302A;
  --d4-gold: #E3C565;
  --d4-gold-text: #E3C565;
  --d4-gold-soft: #2E2814;
  --d4-navy: #C7D2E8;
  --d4-up: #34D399;
  --d4-down: #F87171;
  --d4-down-soft: #3A1A1A;
  --d4-warn: #FBBF24;
  --d4-warn-soft: #33270F;
}`;

const money = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const lakh = (n: number) => (n >= 100_000 ? `₹${(n / 100_000).toFixed(2)}L` : money(n));

function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("min-w-0 rounded-2xl border border-[var(--d4-border)] bg-[var(--d4-surface)] p-5 shadow-[0_1px_2px_rgba(27,42,74,0.04)]", className)}
      {...props}
    />
  );
}

function CardHead({ title, sub, href, linkLabel = "View all" }: { title: string; sub?: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-[15px] font-semibold tracking-tight text-[var(--d4-ink)]">{title}</h2>
        {sub && <p className="mt-0.5 text-[12px] text-[var(--d4-subtle)]">{sub}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold text-[var(--d4-primary)] hover:text-[var(--d4-primary-hover)]"
        >
          {linkLabel} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

function Delta({ value, suffix = "%" }: { value: number; suffix?: string }) {
  const up = value >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums",
        up ? "bg-[var(--d4-primary-soft)] text-[var(--d4-up)]" : "bg-[var(--d4-down-soft)] text-[var(--d4-down)]"
      )}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {up ? "+" : ""}
      {value}
      {suffix}
    </span>
  );
}

const CHANNEL_META: Record<Channel, { label: string; icon: typeof Instagram; color: string }> = {
  instagram: { label: "Instagram", icon: Instagram, color: "var(--d4-primary)" },
  whatsapp: { label: "WhatsApp", icon: MessageCircle, color: "var(--d4-gold)" },
  direct: { label: "Direct link", icon: Link2, color: "var(--d4-navy)" },
};

const STATUS_STYLE: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-[var(--d4-warn-soft)] text-[var(--d4-warn)]" },
  CONFIRMED: { label: "Confirmed", className: "bg-[var(--d4-gold-soft)] text-[var(--d4-gold-text)]" },
  PROCESSING: { label: "Packing", className: "bg-[var(--d4-gold-soft)] text-[var(--d4-gold-text)]" },
  SHIPPED: { label: "Shipped", className: "bg-[var(--d4-primary-soft)] text-[var(--d4-primary)]" },
  DELIVERED: { label: "Delivered", className: "bg-[var(--d4-surface-2)] text-[var(--d4-muted)]" },
};

const ago = (m: number) => (m < 60 ? `${m}m ago` : `${Math.round(m / 60)}h ago`);

/** Champagne-gold progress ring for the monthly goal. */
function GoalRing({ pct }: { pct: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 128 128" className="h-32 w-32" role="img" aria-label={`${pct}% of monthly goal`}>
      <circle cx="64" cy="64" r={r} fill="none" stroke="var(--d4-gold-soft)" strokeWidth="12" />
      <circle
        cx="64"
        cy="64"
        r={r}
        fill="none"
        stroke="var(--d4-gold)"
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={`${(pct / 100) * c} ${c}`}
        transform="rotate(-90 64 64)"
      />
      <text x="64" y="62" textAnchor="middle" fontSize="26" fontWeight="700" fill="var(--d4-ink)">
        {pct}%
      </text>
      <text x="64" y="82" textAnchor="middle" fontSize="11" fill="var(--d4-muted)">
        of goal
      </text>
    </svg>
  );
}

export default async function Demo4Page({ params, searchParams }: { params: { store: string }; searchParams?: { range?: string } }) {
  const { store } = await requireStore(params.store);
  const user = await requireUser();
  const products = await prisma.product.findMany({ where: { storeId: store.id }, select: { name: true }, orderBy: { createdAt: "asc" }, take: 7 });

  const days = [7, 30, 90].includes(Number(searchParams?.range)) ? Number(searchParams?.range) : 30;
  const data = buildSampleData(
    days,
    products.map((p) => p.name)
  );
  const firstName = (user.name ?? user.email.split("@")[0]).split(" ")[0];
  const { kpis } = data;

  // Hero chart: this period vs a deterministic "previous period" for comparison.
  const prevFactor = [0.82, 0.88, 0.79, 0.86, 0.9, 0.84, 0.81, 0.87, 0.83, 0.85, 0.8, 0.86, 0.84, 0.82];
  const trend = data.trend.map((p, i) => {
    const current = p.instagram + p.whatsapp + p.direct;
    return {
      label: new Date(p.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      current,
      previous: Math.round(current * prevFactor[i % prevFactor.length]),
    };
  });
  const spark = trend.map((t) => t.current);
  const peak = trend.reduce((m, t) => (t.current > m.current ? t : m), trend[0]);

  const goal = Math.round(250_000 * (days / 30));
  const goalPct = Math.min(100, Math.round((kpis.revenue.value / goal) * 100));
  const toGo = Math.max(0, goal - kpis.revenue.value);

  const kpiCards = [
    { label: "Revenue", value: lakh(kpis.revenue.value), delta: kpis.revenue.change, spark, tone: "primary" as const },
    { label: "Orders", value: kpis.orders.value.toLocaleString("en-IN"), delta: kpis.orders.change, spark: spark.map((v) => v / kpis.aov.value), tone: "primary" as const },
    { label: "Avg. order value", value: money(kpis.aov.value), delta: kpis.aov.change, spark: spark.map((v, i) => v * (0.9 + (i % 3) * 0.05)), tone: "gold" as const },
    { label: "Conversion rate", value: `${kpis.conversion.value}%`, delta: kpis.conversion.change, suffix: " pts", spark: spark.map((v, i) => v * (0.95 + (i % 4) * 0.03)), tone: "gold" as const },
  ];

  const lowStock = data.products.filter((p) => p.stock < 12);
  const attention = [
    {
      icon: ShoppingBag,
      title: `${kpis.abandoned.value} abandoned carts`,
      body: `${money(kpis.abandoned.lost)} waiting. A WhatsApp nudge recovers ~1 in 8.`,
      cta: "Recover",
      href: `/${store.slug}/orders`,
      tone: "gold",
    },
    {
      icon: PackageCheck,
      title: `${data.recentOrders.filter((o) => o.status === "PENDING" || o.status === "CONFIRMED").length} orders to confirm`,
      body: "Confirm within 24h to keep your delivery promise.",
      cta: "Review",
      href: `/${store.slug}/orders`,
      tone: "primary",
    },
    {
      icon: AlertTriangle,
      title: lowStock.length ? `${lowStock.length} product${lowStock.length > 1 ? "s" : ""} low on stock` : "Stock looks healthy",
      body: lowStock.length ? lowStock.map((p) => p.name).slice(0, 2).join(", ") : "No product is below 12 units.",
      cta: "Restock",
      href: `/${store.slug}/products`,
      tone: "warn",
    },
  ];

  const maxOrders = Math.max(...data.collections.map((c) => c.orders));
  const funnelTop = data.funnel[0].value;

  return (
    <div className="demo4-theme rounded-3xl p-4 sm:p-6">
      <style dangerouslySetInnerHTML={{ __html: THEME_CSS }} />

      <div className="mx-auto max-w-[1280px] space-y-5">
        {/* Demo switcher */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
          <p className="flex items-center gap-2 text-[var(--d4-muted)]">
            <FlaskConical className="h-4 w-4 text-[var(--d4-gold)]" />
            <span>
              <span className="font-semibold text-[var(--d4-ink)]">Demo 4</span> · Emerald &amp; Champagne · sample data
            </span>
          </p>
          <nav className="flex gap-4">
            {[
              ["Demo 1", "overview-demo"],
              ["Demo 2", "demo2"],
              ["Demo 3", "demo3"],
              ["Current Overview", "overview"],
            ].map(([label, path]) => (
              <Link key={path} href={`/${store.slug}/${path}`} className="font-medium text-[var(--d4-muted)] hover:text-[var(--d4-primary)]">
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Header strip: title, single date range, primary actions */}
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--d4-gold-text)]">
              <Gem className="h-3.5 w-3.5" /> {store.name}
            </p>
            <h1 className="mt-1 text-[28px] font-semibold leading-tight tracking-tight text-[var(--d4-ink)] sm:text-[32px]">Good to see you, {firstName}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-[13px] text-[var(--d4-muted)]">
              <CalendarDays className="h-4 w-4" /> Last {days} days, compared with the {days} days before
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div role="group" aria-label="Date range" className="inline-flex rounded-full border border-[var(--d4-border)] bg-[var(--d4-surface)] p-1">
              {[7, 30, 90].map((d) => (
                <Link
                  key={d}
                  href={`/${store.slug}/demo4?range=${d}`}
                  aria-current={d === days ? "page" : undefined}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors",
                    d === days ? "bg-[var(--d4-primary)] text-white" : "text-[var(--d4-muted)] hover:text-[var(--d4-ink)]"
                  )}
                >
                  {d}D
                </Link>
              ))}
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--d4-border)] bg-[var(--d4-surface)] px-4 py-2 text-[13px] font-semibold text-[var(--d4-ink)] hover:border-[var(--d4-gold)]"
            >
              <Share2 className="h-4 w-4" /> Share store
            </button>
            <Link
              href={`/${store.slug}/products/new`}
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--d4-primary)] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[var(--d4-primary-hover)]"
            >
              <Plus className="h-4 w-4" /> Add product
            </Link>
          </div>
        </header>

        {/* KPI row: 4 metrics, each with a comparison and a sparkline */}
        <section aria-label="Key metrics" className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {kpiCards.map((k) => (
            <Card key={k.label} className="p-4 sm:p-5">
              <p className="text-[12px] font-medium text-[var(--d4-muted)]">{k.label}</p>
              <div className="mt-2 flex items-end justify-between gap-2">
                <p className="text-[24px] font-semibold leading-none tracking-tight tabular-nums text-[var(--d4-ink)] sm:text-[28px]">{k.value}</p>
                <div className="hidden sm:block">
                  <Sparkline values={k.spark} tone={k.tone} />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Delta value={k.delta} suffix={k.suffix} />
                <span className="text-[11px] text-[var(--d4-subtle)]">vs previous</span>
              </div>
            </Card>
          ))}
        </section>

        {/* Hero chart + goal */}
        <section className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-[15px] font-semibold tracking-tight">Revenue trend</h2>
                <p className="mt-0.5 text-[12px] text-[var(--d4-subtle)]">
                  Best day: <span className="font-semibold text-[var(--d4-ink)]">{peak.label}</span> · {money(peak.current)}
                </p>
              </div>
              <div className="flex items-center gap-4 text-[12px] text-[var(--d4-muted)]">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[var(--d4-primary)]" /> This period
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-0 w-4 border-t-2 border-dashed border-[var(--d4-gold)]" /> Previous
                </span>
              </div>
            </div>
            <RevenueTrend data={trend} />
          </Card>

          <Card className="flex flex-col">
            <CardHead title="Monthly goal" sub={`Target ${lakh(goal)}`} />
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
              <GoalRing pct={goalPct} />
              <p className="text-[22px] font-semibold tabular-nums">{lakh(kpis.revenue.value)}</p>
              <p className="max-w-[240px] text-[12px] leading-relaxed text-[var(--d4-muted)]">
                {toGo > 0 ? (
                  <>
                    <span className="font-semibold text-[var(--d4-gold-text)]">{money(toGo)}</span> to go, about {Math.ceil(toGo / kpis.aov.value)} more orders at your
                    average basket.
                  </>
                ) : (
                  "Goal reached. Time to set a bigger one."
                )}
              </p>
            </div>
          </Card>
        </section>

        {/* Actionable row */}
        <section className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHead title="Needs your attention" sub="Each item has one next step" />
            <ul className="space-y-3">
              {attention.map((a) => (
                <li key={a.title} className="flex items-start gap-3 rounded-xl bg-[var(--d4-surface-2)] p-3">
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                      a.tone === "gold" && "bg-[var(--d4-gold-soft)] text-[var(--d4-gold-text)]",
                      a.tone === "primary" && "bg-[var(--d4-primary-soft)] text-[var(--d4-primary)]",
                      a.tone === "warn" && "bg-[var(--d4-warn-soft)] text-[var(--d4-warn)]"
                    )}
                  >
                    <a.icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold">{a.title}</p>
                    <p className="mt-0.5 text-[12px] leading-snug text-[var(--d4-muted)]">{a.body}</p>
                  </div>
                  <Link href={a.href} className="shrink-0 self-center text-[12px] font-semibold text-[var(--d4-primary)] hover:underline">
                    {a.cta}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHead title="Sales by channel" sub={`${kpis.orders.value} orders`} />
            <div className="mb-4 flex h-3 w-full overflow-hidden rounded-full" aria-hidden>
              {data.sources.map((s) => (
                <span key={s.key} style={{ width: `${s.share}%`, background: CHANNEL_META[s.key].color }} />
              ))}
            </div>
            <ul className="space-y-3">
              {data.sources.map((s) => {
                const meta = CHANNEL_META[s.key];
                return (
                  <li key={s.key} className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--d4-surface-2)]" style={{ color: meta.color }}>
                      <meta.icon className="h-4 w-4" />
                    </span>
                    <span className="flex-1 text-[13px] font-medium">{meta.label}</span>
                    <span className="text-[12px] tabular-nums text-[var(--d4-muted)]">{Math.round((kpis.orders.value * s.share) / 100)} orders</span>
                    <span className="w-10 text-right text-[13px] font-semibold tabular-nums">{s.share}%</span>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card>
            <CardHead title="Visit to order" sub={`${kpis.conversion.value}% of visits become orders`} />
            <ol className="space-y-2.5">
              {data.funnel.map((f, i) => {
                const pct = (f.value / funnelTop) * 100;
                return (
                  <li key={f.label}>
                    <div className="mb-1 flex justify-between text-[12px]">
                      <span className="text-[var(--d4-muted)]">{f.label}</span>
                      <span className="font-semibold tabular-nums">{f.value.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--d4-surface-2)]">
                      <div
                        className="h-2 rounded-full"
                        style={{ width: `${Math.max(pct, 2)}%`, background: i === data.funnel.length - 1 ? "var(--d4-gold)" : "var(--d4-primary)", opacity: 1 - i * 0.12 }}
                      />
                    </div>
                  </li>
                );
              })}
            </ol>
          </Card>
        </section>

        {/* Supporting detail */}
        <section className="grid gap-4 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardHead title="Top products" sub="By revenue this period" href={`/${store.slug}/products`} />
            <div className="-mx-5 overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-[13px]">
                <thead>
                  <tr className="border-b border-[var(--d4-border)] text-[11px] uppercase tracking-wider text-[var(--d4-subtle)]">
                    <th className="px-5 pb-2 font-semibold">Product</th>
                    <th className="px-3 pb-2 text-right font-semibold">Orders</th>
                    <th className="px-3 pb-2 text-right font-semibold">Conv.</th>
                    <th className="px-3 pb-2 text-right font-semibold">Revenue</th>
                    <th className="px-5 pb-2 text-right font-semibold">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {data.products.slice(0, 5).map((p, i) => (
                    <tr key={p.id} className="border-b border-[var(--d4-border)] last:border-0">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                              i === 0 ? "bg-[var(--d4-gold)] text-white" : "bg-[var(--d4-surface-2)] text-[var(--d4-muted)]"
                            )}
                          >
                            {i + 1}
                          </span>
                          <span className="font-medium">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">{p.orders}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-[var(--d4-muted)]">{p.conversion.toFixed(1)}%</td>
                      <td className="px-3 py-3 text-right font-semibold tabular-nums">{lakh(p.revenue)}</td>
                      <td className="px-5 py-3 text-right">
                        <Delta value={p.change} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="lg:col-span-2">
            <CardHead title="Latest orders" href={`/${store.slug}/orders`} />
            <ul className="divide-y divide-[var(--d4-border)]">
              {data.recentOrders.map((o) => {
                const s = STATUS_STYLE[o.status];
                const ch = CHANNEL_META[o.source];
                return (
                  <li key={o.number} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--d4-primary-soft)] text-[12px] font-semibold text-[var(--d4-primary)]">
                      {o.customer
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold">{o.customer}</p>
                      <p className="flex items-center gap-1 text-[11px] text-[var(--d4-subtle)]">
                        #{o.number} · {ago(o.minutesAgo)} · <ch.icon className="h-3 w-3" /> {ch.label}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[13px] font-semibold tabular-nums">{money(o.total)}</p>
                      <span className={cn("mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold", s.className)}>{s.label}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        </section>

        <p className="pb-2 text-center text-[11px] text-[var(--d4-subtle)]">All figures on this page are sample data for design review.</p>
      </div>
    </div>
  );
}
