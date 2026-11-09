import Link from "next/link";
import { ArrowRight, Check, CheckCircle2, IndianRupee, Package, Plus, ShoppingBag, Users, Wallet } from "lucide-react";
import type { OrderStatus } from "@sellly/database";
import { EmptyState, cn } from "@sellly/ui";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { orderStatusLabel, orderStatusVariant } from "@/lib/order-status";
import { RevenueChart } from "../analytics/_components/revenue-chart";
import { CopyLinkButton } from "../_components/copy-link-button";
import { StatCard, comparison } from "../_components/stat-card";

export const OVERVIEW_RANGES = [
  { key: "7", label: "7 days" },
  { key: "30", label: "30 days" },
  { key: "90", label: "90 days" },
];

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

const AVATAR_TONES = [
  "bg-brand-soft text-brand",
  "bg-success-soft text-success",
  "bg-warning-soft text-warning",
  "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
];

/** First + last initial, with a stable tint per name so rows are easy to tell apart. */
function avatarFor(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const text = ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
  const hash = [...name].reduce((h, c) => h + c.charCodeAt(0), 0);
  return { text, tone: AVATAR_TONES[hash % AVATAR_TONES.length] };
}

const money = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

type Totals = {
  revenue: number;
  orders: number;
  customers: number;
  averageOrderValue: number;
};

export type OverviewViewProps = {
  store: { slug: string; name: string };
  firstName: string;
  days: number;
  storeUrl: string;
  published?: boolean;
  current: Totals;
  previous: Totals;
  topProducts: { productId: string | null; title: string; unitsSold: number }[];
  revenueByDay: { date: string; revenue: number }[];
  funnel: {
    conversionRate: number;
    pageViews: number;
    addToCart: number;
    checkoutStarted: number;
  };
  recentOrders: {
    id: string;
    orderNumber: number;
    customerName: string;
    status: OrderStatus;
    total: number | string;
  }[];
  productCount: number;
  checklist: {
    done: boolean;
    label: string;
    href: string;
    external?: boolean;
  }[];
};

/**
 * The Overview screen. Pure presentation: the real page and the no-login
 * /dev-preview page both render this, so UI edits here show up in both.
 */
export function OverviewView({
  store,
  firstName,
  days,
  storeUrl,
  published,
  current,
  previous,
  topProducts,
  revenueByDay,
  funnel,
  recentOrders,
  productCount,
  checklist,
}: OverviewViewProps) {
  const showChecklist = checklist.some((c) => !c.done);
  const RANGES = OVERVIEW_RANGES;

  return (
    <div className="space-y-8">
      {published && (
        <Alert className="border-success/25 bg-success-soft text-success">
          <CheckCircle2 className="h-4 w-4 !text-success" />
          <AlertDescription>
            Your store is live at <span className="font-semibold">{storeUrl.replace(/^https?:\/\//, "")}</span>. Share it on Instagram or WhatsApp to
            get your first order.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-title text-primary">
            {greeting()}, {firstName}
          </h1>
          <p className="mt-1 text-body text-muted">Overview of {store.name}&apos;s activity.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ToggleGroup type="single" value={String(days)} aria-label="Date range" className="rounded-md border border-border bg-surface p-0.5">
            {RANGES.map((r) => (
              <ToggleGroupItem key={r.key} value={r.key} asChild className="h-8 px-3 text-[13px] text-muted hover:text-primary data-[state=on]:bg-secondary data-[state=on]:text-primary">
                <Link href={`?range=${r.key}`}>{r.label}</Link>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <CopyLinkButton url={storeUrl} label="Copy link" />
        </div>
      </div>

      {showChecklist && (
        <Card>
          <CardHeader className="gap-3 border-b border-border">
            <div>
              <CardTitle className="text-[15px]">Get your store ready</CardTitle>
              <CardDescription>
                {checklist.filter((c) => c.done).length} of {checklist.length} complete
              </CardDescription>
            </div>
            <Progress value={(checklist.filter((c) => c.done).length / checklist.length) * 100} className="h-1.5" />
          </CardHeader>
          <ul className="divide-y divide-border">
            {checklist.map((c) => {
              const inner = (
                <>
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                      c.done ? "border-success bg-success text-white" : "border-border-strong text-transparent",
                    )}
                    aria-hidden="true"
                  >
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  <span
                    className={cn("flex-1 text-[14px]", c.done ? "text-muted line-through decoration-border-strong" : "font-medium text-primary")}
                  >
                    {c.label}
                  </span>
                  <span className="sr-only">{c.done ? "Completed" : "Not completed"}</span>
                  {!c.done && <ArrowRight className="h-4 w-4 text-subtle" />}
                </>
              );
              const cls = "flex items-center gap-3 px-5 py-3.5 transition-colors duration-150 sm:px-6";
              return (
                <li key={c.label}>
                  {c.done ? (
                    <div className={cls}>{inner}</div>
                  ) : c.external ? (
                    <a href={c.href} target="_blank" rel="noreferrer" className={cn(cls, "hover:bg-background")}>
                      {inner}
                    </a>
                  ) : (
                    <Link href={c.href} className={cn(cls, "hover:bg-background")}>
                      {inner}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {productCount === 0 ? (
        <EmptyState
          icon={<Package />}
          title="No products yet"
          description="Add your first product to start building your store."
          action={
            <Button asChild>
              <Link href={`/${store.slug}/products/new`}>
                <Plus /> Add product
              </Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <StatCard icon={IndianRupee} tone="brand" label="Revenue" value={money(current.revenue)} {...comparison(current.revenue, previous.revenue, days)} />
            <StatCard icon={ShoppingBag} tone="success" label="Orders" value={current.orders.toLocaleString("en-IN")} {...comparison(current.orders, previous.orders, days)} />
            <StatCard
              icon={Users}
              tone="violet"
              label="New customers"
              value={current.customers.toLocaleString("en-IN")}
              {...comparison(current.customers, previous.customers, days)}
            />
            <StatCard
              icon={Wallet}
              tone="warning"
              label="Avg. order value"
              value={money(current.averageOrderValue)}
              {...comparison(current.averageOrderValue, previous.averageOrderValue, days)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Revenue</CardTitle>
                <CardDescription>Last {days} days</CardDescription>
              </CardHeader>
              <CardContent>
                <RevenueChart data={revenueByDay} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Store performance</CardTitle>
              </CardHeader>
              <CardContent>
              <dl className="space-y-4">
                <div>
                  <dt className="text-small text-muted">Conversion rate</dt>
                  <dd className="tabular mt-1 text-[26px] font-semibold leading-none tracking-tight text-primary">
                    {funnel.conversionRate.toFixed(1)}%
                  </dd>
                </div>
                <Separator />
                <div className="space-y-2.5 text-small">
                  <div className="flex justify-between">
                    <dt className="text-muted">Store visits</dt>
                    <dd className="tabular font-medium text-primary">{funnel.pageViews.toLocaleString("en-IN")}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted">Added to cart</dt>
                    <dd className="tabular font-medium text-primary">{funnel.addToCart.toLocaleString("en-IN")}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted">Started checkout</dt>
                    <dd className="tabular font-medium text-primary">{funnel.checkoutStarted.toLocaleString("en-IN")}</dd>
                  </div>
                </div>
              </dl>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[15px] font-semibold tracking-tight text-primary">Recent orders</h2>
                <Link href={`/${store.slug}/orders`} className="text-small font-medium text-brand hover:text-brand-hover">
                  View all
                </Link>
              </div>
              {recentOrders.length === 0 ? (
                <EmptyState
                  icon={<Package />}
                  title="No orders yet"
                  description="Share your store link on Instagram or WhatsApp — orders appear here the moment a customer checks out."
                />
              ) : (
                <Card className="overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-24">Order</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead className="w-28 text-right">Amount</TableHead>
                        <TableHead className="w-36 pl-8">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentOrders.map((o) => {
                        const v = orderStatusVariant(o.status);
                        return (
                          <TableRow key={o.id}>
                            <TableCell>
                              <Link href={`/${store.slug}/orders/${o.id}`} className="font-medium text-primary hover:text-brand">
                                #{o.orderNumber}
                              </Link>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2.5 text-muted">
                                <Avatar className="h-7 w-7">
                                  <AvatarFallback className={cn("text-[11px] font-semibold", avatarFor(o.customerName).tone)}>
                                    {avatarFor(o.customerName).text}
                                  </AvatarFallback>
                                </Avatar>
                                {o.customerName}
                              </div>
                            </TableCell>
                            <TableCell className="tabular text-right">{money(Number(o.total))}</TableCell>
                            <TableCell className="pl-8">
                              <Badge variant={v === "default" ? "secondary" : v}>{orderStatusLabel(o.status)}</Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Card>
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Top products</CardTitle>
              </CardHeader>
              <CardContent>
              {topProducts.length === 0 ? (
                <p className="text-small text-muted">No sales in this period yet.</p>
              ) : (
                <ol className="space-y-4">
                  {topProducts.map((p, i) => (
                    <li key={p.productId ?? p.title} className="text-small">
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "tabular flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[12px] font-semibold",
                            i === 0 ? "bg-brand text-white" : "bg-secondary text-muted",
                          )}
                        >
                          {i + 1}
                        </span>
                        <span className="min-w-0 flex-1 truncate font-medium text-primary">{p.title}</span>
                        <span className="tabular text-muted">{p.unitsSold} sold</span>
                      </div>
                      <Progress
                        value={(p.unitsSold / Math.max(...topProducts.map((x) => x.unitsSold), 1)) * 100}
                        className="ml-9 mt-2 h-1.5 w-auto"
                      />
                    </li>
                  ))}
                </ol>
              )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
