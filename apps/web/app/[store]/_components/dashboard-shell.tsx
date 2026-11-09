"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Bell,
  ChevronRight,
  ChevronsUpDown,
  CreditCard,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Package,
  Percent,
  Search,
  Settings,
  ShieldCheck,
  Store as StoreIcon,
  Tag,
  Users,
} from "lucide-react";
import { ThemeToggle } from "@sellly/ui";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
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
      { label: "Products", href: "products", Icon: Tag, sub: [{ label: "All products", href: "products" }, { label: "Add product", href: "products/new" }, { label: "Collections", href: "collections" }] },
      { label: "Customers", href: "customers", Icon: Users },
      { label: "Discounts", href: "discounts", Icon: Percent },
      { label: "Analytics", href: "analytics", Icon: BarChart3 },
    ],
  },
  {
    heading: "Storefront",
    items: [
      { label: "Online Store", href: "online-store", Icon: StoreIcon, sub: [{ label: "Themes & pages", href: "online-store" }, { label: "Domain", href: "domain" }] },
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

function AppSidebar({
  store,
  stores,
  user,
  pendingAccessCount = 0,
}: Pick<ShellProps, "store" | "stores" | "user" | "pendingAccessCount">) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="gap-2 p-3">
        <div className="flex h-9 items-center gap-2.5 px-1 group-data-[collapsible=icon]:hidden">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[14px] font-bold text-brand shadow-sm">S</span>
          <span className="text-[17px] font-semibold tracking-tight text-white">Sellly</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {NAV_GROUPS.map((group, i) => (
          <SidebarGroup key={i}>
            {group.heading && <SidebarGroupLabel>{group.heading}</SidebarGroupLabel>}
            <SidebarMenu>
              {group.items.map((item) => {
                const { label, href, Icon } = item;
                const sub = "sub" in item ? item.sub : undefined;
                const target = `/${store.slug}/${href}`;
                const active = pathname === target || pathname?.startsWith(`${target}/`);
                const open = !!sub && sub.some((x) => pathname?.startsWith(`/${store.slug}/${x.href}`));
                return (
                  <Collapsible key={href} asChild defaultOpen={open}>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={!!active && !sub} tooltip={label} className="font-medium data-[active=true]:bg-white/10 data-[active=true]:text-white">
                        <Link href={target} aria-current={active ? "page" : undefined}>
                          <Icon strokeWidth={1.85} />
                          <span>{label}</span>
                        </Link>
                      </SidebarMenuButton>
                      {sub && (
                        <>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuAction className="data-[state=open]:rotate-90">
                              <ChevronRight />
                              <span className="sr-only">Toggle {label}</span>
                            </SidebarMenuAction>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {sub.map((x) => {
                                const t = `/${store.slug}/${x.href}`;
                                return (
                                  <SidebarMenuSubItem key={x.label}>
                                    <SidebarMenuSubButton asChild isActive={pathname === t}>
                                      <Link href={t}>
                                        <span>{x.label}</span>
                                      </Link>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                );
                              })}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </>
                      )}
                      {href === "access" && pendingAccessCount > 0 && (
                        <SidebarMenuBadge className="bg-amber-400/20 text-amber-200" aria-label={`${pendingAccessCount} pending`}>
                          {pendingAccessCount}
                        </SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  </Collapsible>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" tooltip={store.name} className="border border-white/15 bg-white/[0.06] shadow-sm backdrop-blur-sm hover:border-white/30 hover:bg-white/10 data-[state=open]:bg-white/10">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-white/15 text-[12px] font-semibold text-white">{initials(store.name) || "S"}</AvatarFallback>
                  </Avatar>
                  <span className="grid min-w-0 flex-1 text-left leading-tight">
                    <span className="truncate text-[14px] font-semibold text-white">{store.name}</span>
                    <span className="truncate text-[12px] text-sidebar-foreground/80">{user.email}</span>
                  </span>
                  <ChevronsUpDown className="ml-auto h-4 w-4 text-sidebar-foreground/60" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-[--radix-dropdown-menu-trigger-width] min-w-56">
                <DropdownMenuLabel className="text-caption text-subtle">Switch store</DropdownMenuLabel>
                {stores.map((s) => (
                  <DropdownMenuItem key={s.slug} onSelect={() => router.push(`/${s.slug}/overview`)} className={s.slug === store.slug ? "bg-sidebar-accent" : ""}>
                    <StoreIcon className="h-4 w-4" /> {s.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/${store.slug}/settings`}>
                    <Settings className="h-4 w-4" /> Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/${store.slug}/billing`}>
                    <CreditCard className="h-4 w-4" /> Billing
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <form action={signOutAction}>
                  <DropdownMenuItem asChild>
                    <button type="submit" className="w-full">
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </DropdownMenuItem>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export function DashboardShell({ store, stores, user, recentOrders, newOrderCount, storefrontUrl, pendingAccessCount, children }: ShellProps) {
  const pathname = usePathname();
  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider className="h-svh min-h-0 overflow-hidden">
        <AppSidebar store={store} stores={stores} user={user} pendingAccessCount={pendingAccessCount} />
        <SidebarInset className="h-svh min-h-0 overflow-y-auto overscroll-contain bg-background">
          <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-border/60 bg-background/85 px-4 backdrop-blur sm:px-6">
            <SidebarTrigger className="-ml-1 text-muted" />
            <Separator orientation="vertical" className="h-5" />
            <Breadcrumb className="hidden md:block">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage className="capitalize">{(pathname?.split("/")[2] ?? "overview").replace(/-/g, " ")}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <form action={`/${store.slug}/products`} method="get" role="search" className="relative min-w-0 max-w-md flex-1">
              <label htmlFor="global-search" className="sr-only">
                Search products
              </label>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" aria-hidden="true" />
              <Input id="global-search" suppressHydrationWarning name="q" type="search" placeholder="Search products…" className="h-10 bg-background pl-9" />
            </form>

            <div className="ml-auto flex items-center gap-1">
              {store.status === "DRAFT" && (
                <Link href={`/${store.slug}/settings`} className="mr-1 hidden sm:block">
                  <Badge variant="warning">Draft — not published</Badge>
                </Link>
              )}

              <Button asChild variant="ghost" className="hidden text-muted md:inline-flex">
                <a href={`${storefrontUrl}/${store.slug}`} target="_blank" rel="noreferrer">
                  View store <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Notifications" className="relative h-10 w-10 text-muted">
                    <Bell className="h-[18px] w-[18px]" />
                    {newOrderCount > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand ring-2 ring-surface" aria-hidden="true" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[320px] max-w-[calc(100vw-32px)]">
                  <DropdownMenuLabel>
                    {newOrderCount > 0 ? `${newOrderCount} order${newOrderCount === 1 ? "" : "s"} need attention` : "Recent orders"}
                  </DropdownMenuLabel>
                  {recentOrders.length === 0 ? (
                    <p className="px-2 pb-3 text-small text-muted">No orders yet. New orders will appear here.</p>
                  ) : (
                    recentOrders.map((o) => (
                      <DropdownMenuItem key={o.id} asChild>
                        <Link href={`/${store.slug}/orders/${o.id}`} className="justify-between">
                          <span className="min-w-0 truncate">
                            #{o.orderNumber} · {o.customerName}
                          </span>
                          <span className="shrink-0 text-caption text-subtle">₹{o.total.toLocaleString("en-IN")}</span>
                        </Link>
                      </DropdownMenuItem>
                    ))
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={`/${store.slug}/orders`}>View all orders</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <ThemeToggle />
            </div>
          </header>

          <main className="page-enter mx-auto w-full max-w-[1440px] px-4 pb-8 pt-2 sm:px-6 lg:px-8">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
