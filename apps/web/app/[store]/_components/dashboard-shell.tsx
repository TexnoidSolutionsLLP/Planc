"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Bell,
  ChevronsUpDown,
  CreditCard,
  ExternalLink,
  Globe,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Percent,
  Search,
  Settings,
  ShieldCheck,
  Store as StoreIcon,
  Tag,
  Users,
  X,
} from "lucide-react";
import { Badge, DropdownMenu, MenuLabel, MenuSeparator, ThemeToggle, cn, menuItemClassName } from "@sellly/ui";
import { signOutAction } from "@/lib/actions/auth";

interface ShellProps {
  store: { slug: string; name: string; status: string };
  stores: { slug: string; name: string }[];
  user: { name: string; email: string };
  recentOrders: { id: string; orderNumber: number; customerName: string; status: string; total: number; createdAt: string }[];
  newOrderCount: number;
  storefrontUrl: string;
  /** Staff access requests waiting for the owner's decision (0 for non-owners). */
  pendingAccessCount?: number;
  children: React.ReactNode;
}

const NAV_GROUPS = [
  {
    items: [
      { label: "Overview", href: "overview", Icon: LayoutDashboard },
      { label: "Orders", href: "orders", Icon: Package },
      { label: "Products", href: "products", Icon: Tag },
      { label: "Collections", href: "collections", Icon: Layers },
      { label: "Customers", href: "customers", Icon: Users },
      { label: "Discounts", href: "discounts", Icon: Percent },
      { label: "Analytics", href: "analytics", Icon: BarChart3 },
    ],
  },
  {
    heading: "Storefront",
    items: [
      { label: "Online Store", href: "online-store", Icon: StoreIcon },
      { label: "Domain", href: "domain", Icon: Globe },
    ],
  },
  {
    heading: "Account",
    items: [
      { label: "Billing", href: "billing", Icon: CreditCard },
      { label: "Sellly access", href: "access", Icon: ShieldCheck },
      { label: "Settings", href: "settings", Icon: Settings },
    ],
  },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function SidebarContent({
  store,
  stores,
  pendingAccessCount = 0,
  onNavigate,
}: Pick<ShellProps, "store" | "stores" | "pendingAccessCount"> & { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center gap-2.5 px-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-brand text-[14px] font-bold text-white shadow-sm">S</span>
        <span className="text-[17px] font-semibold tracking-tight text-primary">Sellly</span>
      </div>

      <div className="px-3 pb-4">
        <div className="group relative flex items-center gap-2.5 rounded-lg border border-border bg-background/60 p-2 transition-[border-color,box-shadow,background-color] duration-200 hover:border-brand-border hover:bg-surface focus-within:border-brand focus-within:bg-surface focus-within:ring-[3px] focus-within:ring-brand/[0.12]">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-soft text-[12px] font-semibold text-brand"
          >
            {initials(store.name) || "S"}
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block text-[11px] font-medium uppercase tracking-wide text-subtle">Store</span>
            <span className="block truncate text-[14px] font-semibold text-primary">{store.name}</span>
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-subtle transition-colors group-hover:text-primary" aria-hidden="true" />
          <label htmlFor="store-switcher" className="sr-only">
            Switch store
          </label>
          <select
            id="store-switcher"
            value={store.slug}
            onChange={(e) => {
              onNavigate?.();
              router.push(`/${e.target.value}/overview`);
            }}
            className="absolute inset-0 h-full w-full cursor-pointer appearance-none rounded-lg opacity-0 focus:outline-none"
          >
            {stores.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <nav aria-label="Main" className="flex-1 space-y-5 overflow-y-auto px-3 pb-4 pt-1">
        {NAV_GROUPS.map((group, i) => (
          <div key={i}>
            {group.heading && <p className="mb-1.5 px-3 text-caption text-subtle">{group.heading}</p>}
            <ul className="space-y-0.5">
              {group.items.map(({ label, href, Icon }) => {
                const target = `/${store.slug}/${href}`;
                const active = pathname === target || pathname?.startsWith(`${target}/`);
                return (
                  <li key={href}>
                    <Link
                      href={target}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex h-10 items-center gap-3 rounded-lg px-3 text-[14px] font-medium transition-colors duration-150 focus-visible:ring-[3px] focus-visible:ring-brand/25 focus-visible:outline-none lg:h-9",
                        active ? "bg-brand-soft text-brand" : "text-muted hover:bg-secondary/70 hover:text-primary"
                      )}
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.85} />
                      {label}
                      {href === "access" && pendingAccessCount > 0 && (
                        <Badge variant="warning" className="ml-auto" aria-label={`${pendingAccessCount} pending`}>
                          {pendingAccessCount}
                        </Badge>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );
}

export function DashboardShell({ store, stores, user, recentOrders, newOrderCount, storefrontUrl, pendingAccessCount, children }: ShellProps) {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => setDrawerOpen(false), [pathname]);
  React.useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] border-r border-border bg-surface lg:block">
        <SidebarContent store={store} stores={stores} pendingAccessCount={pendingAccessCount} />
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-slate-900/35" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
          <aside className="relative h-full w-[280px] max-w-[85vw] animate-slide-in-left border-r border-border bg-surface shadow-lg">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setDrawerOpen(false)}
              className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded text-muted hover:bg-secondary hover:text-primary"
            >
              <X className="h-[18px] w-[18px]" />
            </button>
            <SidebarContent store={store} stores={stores} pendingAccessCount={pendingAccessCount} onNavigate={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-surface/85 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setDrawerOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded text-muted transition-colors hover:bg-secondary hover:text-primary focus-visible:ring-[3px] focus-visible:ring-brand/25 focus-visible:outline-none lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <form action={`/${store.slug}/products`} method="get" role="search" className="relative min-w-0 max-w-md flex-1">
            <label htmlFor="global-search" className="sr-only">
              Search products
            </label>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" aria-hidden="true" />
            <input
              id="global-search"
              suppressHydrationWarning
              name="q"
              type="search"
              placeholder="Search products…"
              className="h-10 w-full rounded border border-border bg-background pl-9 pr-3 text-[14px] text-primary placeholder:text-subtle transition-[border-color,box-shadow,background-color] duration-200 focus-visible:border-brand focus-visible:bg-surface focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand/[0.12]"
            />
          </form>

          <div className="ml-auto flex items-center gap-1">
            {store.status === "DRAFT" && (
              <Link href={`/${store.slug}/settings`} className="mr-1 hidden sm:block">
                <Badge variant="warning">Draft — not published</Badge>
              </Link>
            )}

            <a
              href={`${storefrontUrl}/${store.slug}`}
              target="_blank"
              rel="noreferrer"
              className="hidden h-10 items-center gap-1.5 rounded px-3 text-[14px] font-medium text-muted transition-colors hover:bg-secondary hover:text-primary focus-visible:ring-[3px] focus-visible:ring-brand/25 focus-visible:outline-none md:inline-flex"
            >
              View store <ExternalLink className="h-3.5 w-3.5" />
            </a>

            <DropdownMenu
              label="Notifications"
              triggerClassName="relative h-10 w-10 justify-center text-muted hover:bg-secondary hover:text-primary"
              panelClassName="w-[320px] max-w-[calc(100vw-32px)]"
              trigger={
                <>
                  <Bell className="h-[18px] w-[18px]" />
                  {newOrderCount > 0 && (
                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand ring-2 ring-surface" aria-hidden="true" />
                  )}
                </>
              }
            >
              <MenuLabel>{newOrderCount > 0 ? `${newOrderCount} order${newOrderCount === 1 ? "" : "s"} need attention` : "Recent orders"}</MenuLabel>
              {recentOrders.length === 0 ? (
                <p className="px-2.5 pb-3 text-small text-muted">No orders yet. New orders will appear here.</p>
              ) : (
                recentOrders.map((o) => (
                  <Link key={o.id} href={`/${store.slug}/orders/${o.id}`} className={cn(menuItemClassName, "justify-between")}>
                    <span className="min-w-0 truncate">
                      #{o.orderNumber} · {o.customerName}
                    </span>
                    <span className="shrink-0 text-caption text-subtle">₹{o.total.toLocaleString("en-IN")}</span>
                  </Link>
                ))
              )}
              <MenuSeparator />
              <Link href={`/${store.slug}/orders`} className={menuItemClassName}>
                View all orders
              </Link>
            </DropdownMenu>

            <ThemeToggle />

            <DropdownMenu
              label="Account menu"
              triggerClassName="ml-1 h-9 w-9 justify-center rounded-full bg-brand-soft text-[12px] font-semibold text-brand hover:bg-brand-border/60"
              trigger={<span aria-hidden="true">{initials(user.name) || "U"}</span>}
            >
              <MenuLabel className="pb-1">
                <span className="block text-[14px] font-medium text-primary">{user.name}</span>
                <span className="block text-small text-muted">{user.email}</span>
              </MenuLabel>
              <MenuSeparator />
              <Link href={`/${store.slug}/settings`} className={menuItemClassName}>
                <Settings /> Settings
              </Link>
              <Link href={`/${store.slug}/billing`} className={menuItemClassName}>
                <CreditCard /> Billing
              </Link>
              <MenuSeparator />
              <form action={signOutAction}>
                <button type="submit" className={menuItemClassName}>
                  <LogOut /> Sign out
                </button>
              </form>
            </DropdownMenu>
          </div>
        </header>

        <main className="page-enter mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
