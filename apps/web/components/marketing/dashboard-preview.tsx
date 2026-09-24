import { BarChart3, LayoutDashboard, Package, Search, Tag, Users } from "lucide-react";

/** Static composition of the real dashboard, used as the hero visual. */
export function DashboardPreview() {
  const metrics = [
    { label: "Revenue", value: "₹2,48,900", change: "+12.4%" },
    { label: "Orders", value: "1,284", change: "+8.2%" },
    { label: "Conversion", value: "4.8%", change: "+0.8%" },
    { label: "Customers", value: "8,492", change: "+14.1%" },
  ];
  const orders = [
    { id: "#1042", name: "Ananya Rao", amount: "₹1,499", status: "Shipped", tone: "text-brand bg-brand-soft" },
    { id: "#1041", name: "Meera Iyer", amount: "₹899", status: "Delivered", tone: "text-success bg-success-soft" },
    { id: "#1040", name: "Karthik S.", amount: "₹2,148", status: "Confirmed", tone: "text-brand bg-brand-soft" },
    { id: "#1039", name: "Sana Khan", amount: "₹649", status: "Pending", tone: "text-warning bg-warning-soft" },
  ];
  const nav = [
    { Icon: LayoutDashboard, label: "Overview", active: true },
    { Icon: Package, label: "Orders" },
    { Icon: Tag, label: "Products" },
    { Icon: Users, label: "Customers" },
    { Icon: BarChart3, label: "Analytics" },
  ];

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-lg" aria-hidden="true">
      <div className="flex items-center gap-1.5 border-b border-border bg-background px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
        <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
        <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
        <span className="ml-3 hidden rounded bg-surface px-3 py-1 text-caption text-subtle sm:block">app.sellly.com/aria-jewelry/overview</span>
      </div>
      <div className="flex">
        <div className="hidden w-44 shrink-0 border-r border-border p-3 md:block">
          <div className="mb-4 flex items-center gap-2 px-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-brand text-[11px] font-bold text-white">S</span>
            <span className="text-[13px] font-semibold text-primary">Sellly</span>
          </div>
          <ul className="space-y-0.5">
            {nav.map(({ Icon, label, active }) => (
              <li key={label} className={`flex items-center gap-2.5 rounded-[6px] px-2.5 py-1.5 text-[12.5px] font-medium ${active ? "bg-secondary text-primary" : "text-muted"}`}>
                <Icon className={`h-4 w-4 ${active ? "text-brand" : ""}`} />
                {label}
              </li>
            ))}
          </ul>
        </div>
        <div className="min-w-0 flex-1 bg-background p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[15px] font-semibold tracking-tight text-primary">Good morning, Priya</p>
              <p className="text-caption text-muted">Overview of Aria Jewelry&apos;s activity</p>
            </div>
            <div className="hidden items-center gap-2 rounded border border-border bg-surface px-3 py-1.5 text-caption text-subtle sm:flex">
              <Search className="h-3.5 w-3.5" /> Search products…
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            {metrics.map((m) => (
              <div key={m.label} className="rounded-md border border-border bg-surface p-3">
                <p className="text-caption text-muted">{m.label}</p>
                <p className="mt-1 text-[18px] font-semibold tracking-tight text-primary">{m.value}</p>
                <p className="mt-1 text-caption font-medium text-success">↑ {m.change}</p>
              </div>
            ))}
          </div>
          <div className="mt-2.5 grid gap-2.5 lg:grid-cols-5">
            <div className="rounded-md border border-border bg-surface p-3 lg:col-span-3">
              <p className="mb-2 text-[12.5px] font-semibold text-primary">Revenue</p>
              <svg viewBox="0 0 300 100" className="h-28 w-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="previewFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[25, 50, 75].map((y) => (
                  <line key={y} x1="0" x2="300" y1={y} y2={y} stroke="rgb(var(--color-border))" strokeWidth="1" />
                ))}
                <path d="M0,78 C25,70 40,72 60,58 C85,42 100,52 125,40 C150,28 170,46 195,30 C220,16 245,26 270,12 L300,8 L300,100 L0,100 Z" fill="url(#previewFill)" />
                <path d="M0,78 C25,70 40,72 60,58 C85,42 100,52 125,40 C150,28 170,46 195,30 C220,16 245,26 270,12 L300,8" fill="none" stroke="#2563EB" strokeWidth="2" vectorEffect="non-scaling-stroke" />
              </svg>
            </div>
            <div className="rounded-md border border-border bg-surface p-3 lg:col-span-2">
              <p className="mb-2 text-[12.5px] font-semibold text-primary">Recent orders</p>
              <ul className="space-y-2">
                {orders.map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-2 text-[12px]">
                    <span className="min-w-0 truncate text-primary">
                      <span className="font-medium">{o.id}</span> <span className="text-muted">{o.name}</span>
                    </span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${o.tone}`}>{o.status}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
