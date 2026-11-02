import Link from "next/link";
import { ArrowDownToLine, ArrowUpRight, Banknote, CalendarDays, ChevronDown, FlaskConical, Plus, Radio, Wallet } from "lucide-react";
import { prisma } from "@sellly/database";
import { cn } from "@sellly/ui";
import { requireStore, requireUser } from "@/lib/session";
import { buildSampleData } from "../overview-demo/_lib/sample-data";
import { BalanceWave, SalesBars } from "./_components/charts";

/**
 * Demo 3 — soft, rounded "finance app" take on the Overview, in green. The palette
 * is scoped to `.demo3-theme`; the shell and other pages are untouched. Metrics
 * are sample data.
 */

const THEME_CSS = `
.demo3-theme {
  --color-primary: 21 128 61;
  --color-primary-hover: 22 101 52;
  --color-primary-deep: 20 83 45;
  --color-primary-soft: 236 247 239;
  --color-primary-border: 187 230 199;
  --color-surface-2: 243 246 244;
}
.dark .demo3-theme {
  --color-primary: 74 222 128;
  --color-primary-hover: 134 239 172;
  --color-primary-deep: 187 247 208;
  --color-primary-soft: 18 46 30;
  --color-primary-border: 22 101 52;
  --color-surface-2: 24 30 26;
}`;

const money = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

/** Splits "₹1,84,250.40" into a strong whole part and a muted paise part, like the reference. */
function Amount({ value, className }: { value: number; className?: string }) {
  const [whole, paise] = value.toFixed(2).split(".");
  return (
    <span className={cn("tabular font-semibold tracking-tight", className)}>
      ₹{Number(whole).toLocaleString("en-IN")}
      <span className="opacity-50">.{paise}</span>
    </span>
  );
}

function Panel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-[22px] border border-border bg-surface p-5", className)} {...props} />;
}

function PanelHead({ icon, title, sub, href }: { icon?: React.ReactNode; title: string; sub?: string; href?: string }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        {icon && <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-primary">{icon}</span>}
        <div>
          <h2 className="text-[14px] font-semibold tracking-tight text-primary">{title}</h2>
          {sub && <p className="text-caption font-normal text-subtle">{sub}</p>}
        </div>
      </div>
      {href && (
        <Link
          href={href}
          aria-label={`Open ${title}`}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-muted transition-colors hover:border-brand hover:text-brand"
        >
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

const AVATAR_TONES = ["bg-brand text-white", "bg-warning-soft text-warning", "bg-brand-soft text-brand", "bg-secondary text-primary", "bg-error-soft text-error"];

function Initials({ name, i, className }: { name: string; i: number; className?: string }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);
  return (
    <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-caption font-semibold", AVATAR_TONES[i % AVATAR_TONES.length], className)}>
      {initials}
    </span>
  );
}

export default async function Demo3Page({ params }: { params: { store: string } }) {
  const { store } = await requireStore(params.store);
  const user = await requireUser();
  const products = await prisma.product.findMany({ where: { storeId: store.id }, select: { name: true }, orderBy: { createdAt: "asc" }, take: 7 });
  const data = buildSampleData(
    30,
    products.map((p) => p.name)
  );
  const firstName = (user.name ?? user.email.split("@")[0]).split(" ")[0];

  // Sample finance figures derived from the shared demo data.
  const payoutBalance = Math.round(data.kpis.revenue.value * 0.42) + 0.6;
  const weeklyRevenue = Math.round(data.kpis.revenue.value / 4.3);
  const codPending = Math.round(data.kpis.revenue.value * 0.18) + 0.89;

  const months = ["May", "Jun", "Jul", "Aug", "Sep", "Oct"];
  const monthly = months.map((label, i) => ({ label, value: Math.round(data.kpis.revenue.value * [0.42, 0.68, 0.55, 0.92, 0.71, 1][i]) }));
  const weekly = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label, i) => ({
    label,
    value: Math.round(weeklyRevenue * [0.11, 0.13, 0.1, 0.15, 0.19, 0.2, 0.12][i]),
  }));
  const wave = Array.from({ length: 24 }, (_, i) => {
    const t = i / 23;
    return { label: `Day ${i + 1}`, value: Math.round(payoutBalance * (0.72 + 0.12 * Math.sin(t * 9) + 0.07 * Math.sin(t * 23) + 0.15 * t)) };
  });

  const methods = ["UPI", "Cash on delivery", "Card", "UPI", "UPI"];
  const payments = data.recentOrders.map((o, i) => {
    const d = new Date(Date.now() - o.minutesAgo * 60_000);
    return {
      ...o,
      method: methods[i],
      date: d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      time: d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }),
      paid: methods[i] !== "Cash on delivery",
    };
  });

  const topCustomers = ["Priya Sharma", "Ananya Iyer", "Rohan Mehta", "Kavya Reddy", "Meera Nair", "Arjun Rao", "Sana Khan"];
  const repeatRate = 34;

  const today = new Date();
  const from = new Date(today.getTime() - 29 * 86_400_000);
  const fmt = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="demo3-theme">
      <style dangerouslySetInnerHTML={{ __html: THEME_CSS }} />

      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-small">
          <p className="flex items-center gap-2 text-muted">
            <FlaskConical className="h-4 w-4 text-brand" />
            <span>
              <span className="font-semibold text-primary">Demo 3</span> · sample data
            </span>
          </p>
          <div className="flex gap-4">
            <Link href={`/${store.slug}/overview-demo`} className="font-medium text-muted hover:text-brand">
              Demo 1
            </Link>
            <Link href={`/${store.slug}/demo2`} className="font-medium text-muted hover:text-brand">
              Demo 2
            </Link>
            <Link href={`/${store.slug}/overview`} className="font-medium text-muted hover:text-brand">
              Current Overview
            </Link>
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="text-[30px] font-medium leading-tight tracking-tight text-primary sm:text-[34px]">
            Welcome back, <span className="font-normal text-subtle">{firstName}</span>
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-surface px-4 text-[13px] font-medium text-primary">
              <CalendarDays className="h-4 w-4 text-muted" />
              {fmt(from)} – {fmt(today)}
              <ChevronDown className="h-3.5 w-3.5 text-subtle" />
            </span>
            <Link
              href={`/${store.slug}/products/new`}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-[13px] font-semibold text-surface transition-opacity hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> Add product
            </Link>
          </div>
        </div>

        {/* Row 1 */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-12">
          {/* Payout card + weekly revenue */}
          <div className="flex flex-col gap-4 xl:col-span-3">
            <Panel className="flex-1">
              <PanelHead title="Payout balance" sub="Settles to your bank" href={`/${store.slug}/billing`} />
              <div className="relative overflow-hidden rounded-[18px] bg-brand p-5 text-white">
                <span className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" aria-hidden="true" />
                <span className="absolute -bottom-14 right-8 h-32 w-32 rounded-full bg-white/10" aria-hidden="true" />
                <div className="relative flex items-center justify-between">
                  <span className="text-[13px] font-bold tracking-wide">{store.name}</span>
                  <Radio className="h-4 w-4 opacity-80" aria-hidden="true" />
                </div>
                <p className="relative mt-4 text-caption font-normal text-white/75">Available to settle</p>
                <Amount value={payoutBalance} className="relative mt-1 block text-[28px] leading-none" />
                <div className="relative mt-5 flex items-center justify-between gap-2 whitespace-nowrap text-caption font-medium text-white/80">
                  <span className="tabular">•••• 4821</span>
                  <span>Payout · 31 Oct</span>
                </div>
              </div>
            </Panel>
            <Panel className="flex items-center justify-between">
              <div>
                <p className="text-caption font-normal text-subtle">Weekly revenue</p>
                <p className="tabular mt-1 text-[22px] font-semibold tracking-tight text-primary">+{money(weeklyRevenue)}</p>
              </div>
              <span className="rounded-full bg-brand px-2.5 py-1 text-caption font-semibold text-white">+{data.kpis.revenue.change}%</span>
            </Panel>
          </div>

          {/* Sales bars */}
          <Panel className="md:col-span-2 xl:col-span-5">
            <div className="-mb-12 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-primary">
                  <Banknote className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-[14px] font-semibold tracking-tight text-primary">Sales</h2>
                  <p className="text-caption font-normal text-subtle">Peak period highlighted</p>
                </div>
              </div>
            </div>
            <SalesBars weekly={weekly} monthly={monthly} />
          </Panel>

          {/* Balance wave */}
          <Panel className="flex flex-col overflow-hidden p-0 xl:col-span-4">
            <div className="p-5 pb-0">
              <PanelHead title="Store earnings" sub="Net after fees & refunds" href={`/${store.slug}/analytics`} />
              <p className="text-center text-caption font-normal text-subtle">Total earnings</p>
              <p className="mt-1 text-center">
                <Amount value={data.kpis.revenue.value * 0.93 + 0.9} className="text-[30px] text-primary" />
              </p>
            </div>
            <div className="relative mt-auto">
              <BalanceWave data={wave} />
              <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
                <Link
                  href={`/${store.slug}/billing`}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full bg-brand px-4 text-[13px] font-semibold text-white shadow-md transition-colors hover:bg-brand-hover"
                >
                  Withdraw <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href={`/${store.slug}/orders`}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full bg-surface px-4 text-[13px] font-semibold text-primary shadow-md transition-colors hover:bg-secondary"
                >
                  Statement <ArrowDownToLine className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </Panel>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          {/* Payment history */}
          <Panel className="xl:col-span-8">
            <PanelHead title="Payment history" sub="Latest customer payments" href={`/${store.slug}/orders`} />
            <div className="relative -mx-5 overflow-x-auto px-5">
              <table className="w-full min-w-[620px] text-left text-small">
                <thead>
                  <tr className="text-caption font-medium text-subtle">
                    <th className="pb-2 font-medium">Customer</th>
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Time</th>
                    <th className="pb-2 font-medium">Method</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p, i) => (
                    <tr key={p.number} className="group">
                      <td className="rounded-l-[14px] py-2.5 pl-2 group-hover:bg-secondary">
                        <div className="flex items-center gap-3">
                          <Initials name={p.customer} i={i} />
                          <div>
                            <p className="font-semibold text-primary">{p.customer}</p>
                            <p className="text-caption font-normal text-subtle">Order #{p.number}</p>
                          </div>
                        </div>
                      </td>
                      <td className="tabular py-2.5 text-muted group-hover:bg-secondary">{p.date}</td>
                      <td className="tabular py-2.5 text-muted group-hover:bg-secondary">{p.time}</td>
                      <td className="py-2.5 text-muted group-hover:bg-secondary">{p.method}</td>
                      <td className="py-2.5 group-hover:bg-secondary">
                        <span className={cn("inline-flex items-center gap-1.5 text-caption font-semibold", p.paid ? "text-success" : "text-warning")}>
                          <span className={cn("h-1.5 w-1.5 rounded-full", p.paid ? "bg-success" : "bg-warning")} aria-hidden="true" />
                          {p.paid ? "Successful" : "To collect"}
                        </span>
                      </td>
                      <td className="tabular rounded-r-[14px] py-2.5 pr-2 text-right font-semibold text-primary group-hover:bg-secondary">{money(p.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          {/* COD + customers */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:col-span-4 xl:grid-cols-1">
            <Panel>
              <PanelHead icon={<Wallet className="h-4 w-4" />} title="Cash to collect" sub="COD orders out for delivery" />
              <div className="flex flex-wrap items-center gap-3">
                <Amount value={codPending} className="text-[30px] leading-none text-primary" />
                <span className="rounded-full bg-brand px-2 py-0.5 text-caption font-semibold text-white">{Math.round(data.kpis.orders.value * 0.2)} orders</span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary" aria-hidden="true">
                <div className="h-full w-[64%] rounded-full bg-brand" />
              </div>
              <p className="mt-2 text-caption font-normal text-subtle">64% collected by courier partners this week</p>
            </Panel>

            <Panel className="bg-secondary">
              <PanelHead title="Repeat customers" sub={`${repeatRate}% of orders this month`} href={`/${store.slug}/customers`} />
              <div className="flex items-center">
                {topCustomers.slice(0, 4).map((c, i) => (
                  <Initials key={c} name={c} i={i} className="-ml-2 h-11 w-11 border-[3px] border-secondary text-small first:ml-0" />
                ))}
                <span className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-secondary bg-brand text-small font-semibold text-white">
                  +{topCustomers.length - 4 + 18}
                </span>
              </div>
            </Panel>
          </div>
        </div>

        <p className="pb-2 text-center text-caption font-normal text-subtle">All figures on this page are sample data for design review.</p>
      </div>
    </div>
  );
}
