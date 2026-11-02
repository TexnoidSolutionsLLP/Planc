import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Clock, FlaskConical, Headphones, Inbox, PackageCheck, ShoppingBag, Truck } from "lucide-react";
import { requireStore } from "@/lib/session";
import { ActivityList, TrendsChart } from "./_components/client";

/**
 * Demo 5 — e-commerce ops dashboard: gradient order tiles, inbox, to-dos and
 * today-vs-yesterday trends. Built on the theme tokens, so it follows the
 * dashboard's light/dark toggle. Figures are sample data.
 */

const money = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default async function Demo5Page({ params }: { params: { store: string } }) {
  const { store } = await requireStore(params.store);
  const s = store.slug;

  const tiles = [
    { label: "Shipped orders", value: 67, Icon: Truck, gradient: "from-sky-400 to-indigo-600", href: `/${s}/orders?status=SHIPPED` },
    { label: "Pending orders", value: 9, Icon: Clock, gradient: "from-orange-400 to-rose-500", href: `/${s}/orders?status=PENDING` },
    { label: "New orders", value: 35, Icon: ShoppingBag, gradient: "from-fuchsia-500 to-violet-600", href: `/${s}/orders?status=CONFIRMED` },
  ];

  const inbox = [
    { text: "Customer asked about order #1048 delivery", time: "4:39 PM", unread: true },
    { text: "Return request for order #1031", time: "1:07 PM", unread: true },
    { text: "WhatsApp: “Is the Luna necklace back in stock?”", time: "11:20 AM", unread: false },
  ];

  const tasks = [
    { id: 1, label: "Confirm 9 pending orders", tag: "Urgent" as const, done: true },
    { id: 2, label: "Pack & ship today's orders", tag: "Urgent" as const, done: false },
    { id: 3, label: "Add new collection photos", tag: "New" as const, done: false },
    { id: 4, label: "Update shipping rates", tag: "Default" as const, done: true },
  ];

  const base = [2, 1, 1, 2, 4, 7, 11, 9, 14, 18, 15, 12, 17, 22, 19, 13];
  const trends = base.map((v, i) => ({
    hour: `${(8 + i) % 12 || 12}${8 + i < 12 ? "am" : "pm"}`,
    today: v,
    yesterday: Math.max(1, Math.round(v * 0.75 + 4 * Math.sin(i / 2))),
  }));
  const todayTotal = trends.reduce((a, t) => a + t.today, 0);
  const yesterdayTotal = trends.reduce((a, t) => a + t.yesterday, 0);
  const busiest = trends.reduce((m, t) => (t.today > m.today ? t : m), trends[0]).hour;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-caption font-normal text-subtle">
            <FlaskConical className="h-3.5 w-3.5 text-indigo-500" /> Demo 5 · sample data
          </p>
          <p className="mt-2 text-small text-muted">Total revenue</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <span className="tabular text-[30px] font-bold leading-none tracking-tight text-primary">{money(184250)}</span>
            <span className="inline-flex items-center gap-0.5 text-caption font-semibold text-rose-500">
              <ArrowDownRight className="h-3.5 w-3.5" />
              2.4% <span className="font-normal text-subtle">vs last week</span>
            </span>
            <span className="inline-flex items-center gap-0.5 text-caption font-semibold text-emerald-500">
              <ArrowUpRight className="h-3.5 w-3.5" />
              18.4% <span className="font-normal text-subtle">vs last month</span>
            </span>
          </div>
        </div>
        <div className="flex gap-4 text-small">
          {[
            ["Demo 1", "overview-demo"],
            ["Demo 2", "demo2"],
            ["Demo 3", "demo3"],
            ["Current", "overview"],
          ].map(([l, h]) => (
            <Link key={h} href={`/${s}/${h}`} className="font-medium text-muted hover:text-indigo-500">
              {l}
            </Link>
          ))}
        </div>
      </div>

      {/* Gradient tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {tiles.map((t) => (
          <Link
            key={t.label}
            href={t.href}
            className={`group relative flex h-[120px] items-start justify-between overflow-hidden rounded-[14px] bg-gradient-to-br ${t.gradient} p-5 text-white shadow-md transition-transform duration-200 hover:-translate-y-0.5`}
          >
            <t.Icon className="absolute -bottom-3 left-3 h-20 w-20 opacity-20 transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
            <span className="relative text-[15px] font-semibold">{t.label}</span>
            <span className="tabular relative self-end text-[44px] font-bold leading-none">{String(t.value).padStart(2, "0")}</span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        {/* Left column */}
        <div className="space-y-5 lg:col-span-2">
          <section className="rounded-[14px] border border-border bg-surface p-5">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-[15px] font-semibold text-primary">
                  <Inbox className="h-4 w-4 text-indigo-500" /> Inbox
                </h2>
                <p className="text-caption font-normal text-subtle">2 unread customer messages</p>
              </div>
              <Link href={`/${s}/orders`} className="text-small font-semibold text-indigo-500 hover:text-indigo-600">
                View details
              </Link>
            </div>
            <ul className="divide-y divide-border">
              {inbox.map((m) => (
                <li key={m.text} className="flex items-center gap-3 py-2.5 text-small">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${m.unread ? "bg-indigo-500" : "bg-transparent"}`} aria-hidden="true" />
                  <span className={`min-w-0 flex-1 truncate ${m.unread ? "font-medium text-primary" : "text-muted"}`}>{m.text}</span>
                  <span className="tabular shrink-0 text-caption font-normal text-subtle">{m.time}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-[14px] border border-border bg-surface p-5">
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-primary">Recent activity</h2>
              <Link href={`/${s}/orders`} className="text-small font-semibold text-indigo-500 hover:text-indigo-600">
                View all
              </Link>
            </div>
            <ActivityList initial={tasks} />
          </section>

          <section className="flex items-center gap-4 rounded-[14px] bg-gradient-to-r from-indigo-500/10 to-fuchsia-500/10 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-white">
              <Headphones className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-small font-semibold text-primary">Need help with your store?</p>
              <p className="text-caption font-normal text-muted">Our team replies within an hour.</p>
            </div>
            <a href="mailto:support@sellly.app" className="rounded-full bg-cyan-400 px-3 py-1.5 text-caption font-semibold text-cyan-950 hover:bg-cyan-300">
              Contact us
            </a>
          </section>
        </div>

        {/* Trends */}
        <section className="rounded-[14px] border border-border bg-surface p-5 lg:col-span-3">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-semibold text-primary">Today&apos;s trends</h2>
              <p className="text-caption font-normal text-subtle">
                {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · orders per hour
              </p>
            </div>
            <ul className="flex items-center gap-4 text-caption text-muted">
              <li className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 rounded bg-gradient-to-r from-indigo-500 to-purple-500" /> Today
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 rounded bg-border-strong" /> Yesterday
              </li>
            </ul>
          </div>
          <TrendsChart data={trends} />
          <div className="mt-4 grid grid-cols-3 divide-x divide-border rounded-[10px] bg-secondary py-3 text-center">
            <div>
              <p className="tabular text-[18px] font-bold text-primary">{todayTotal}</p>
              <p className="text-caption font-normal text-subtle">Orders today</p>
            </div>
            <div>
              <p className="tabular text-[18px] font-bold text-emerald-500">+{Math.round(((todayTotal - yesterdayTotal) / yesterdayTotal) * 100)}%</p>
              <p className="text-caption font-normal text-subtle">vs yesterday</p>
            </div>
            <div>
              <p className="flex items-center justify-center gap-1 text-[18px] font-bold text-primary">
                <PackageCheck className="h-4 w-4 text-indigo-500" /> {busiest}
              </p>
              <p className="text-caption font-normal text-subtle">Busiest hour</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
