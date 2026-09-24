import Link from "next/link";
import { ArrowRight, Check, CheckCircle2, Package, Plus } from "lucide-react";
import { prisma } from "@sellly/database";
import { getConversionFunnel, getRevenueByDay, getStoreOverview, getTopProducts } from "@sellly/analytics";
import { Badge, Card, CardHeader, CardTitle, EmptyState, Table, Td, Th, Thead, Tr, buttonVariants, cn } from "@sellly/ui";
import { requireStore, requireUser } from "@/lib/session";
import { orderStatusLabel, orderStatusVariant } from "@/lib/order-status";
import { RevenueChart } from "../analytics/_components/revenue-chart";
import { CopyLinkButton } from "../_components/copy-link-button";
import { StatCard, comparison } from "../_components/stat-card";

const RANGES = [
  { key: "7", label: "7 days" },
  { key: "30", label: "30 days" },
  { key: "90", label: "90 days" },
];

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

const money = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export default async function OverviewPage({
  params,
  searchParams,
}: {
  params: { store: string };
  searchParams: { published?: string; range?: string };
}) {
  const { store } = await requireStore(params.store);
  const user = await requireUser();

  const days = ["7", "30", "90"].includes(searchParams.range ?? "") ? Number(searchParams.range) : 30;
  const dayMs = 24 * 60 * 60 * 1000;
  const since = new Date(Date.now() - days * dayMs);
  const previousSince = new Date(since.getTime() - days * dayMs);

  const [current, previous, topProducts, revenueByDay, funnel, recentOrders, productCount, settings, paymentConnection] = await Promise.all([
    getStoreOverview(store.id, since),
    getStoreOverview(store.id, previousSince, since),
    getTopProducts(store.id, since, 5),
    getRevenueByDay(store.id, since),
    getConversionFunnel(store.id, since),
    prisma.order.findMany({ where: { storeId: store.id }, orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.product.count({ where: { storeId: store.id } }),
    prisma.storeSettings.findUnique({ where: { storeId: store.id } }),
    prisma.paymentConnection.findFirst({ where: { storeId: store.id, isActive: true } }),
  ]);

  const orderCount = await prisma.order.count({ where: { storeId: store.id } });
  const storefrontUrl = process.env.STOREFRONT_URL ?? "http://localhost:3001";
  const storeUrl = `${storefrontUrl}/${store.slug}`;
  const firstName = (user.name ?? user.email.split("@")[0]).split(" ")[0];

  const checklist = [
    { done: productCount > 0, label: "Add your first product", href: `/${store.slug}/products/new` },
    { done: store.status === "PUBLISHED", label: "Publish your store", href: `/${store.slug}/settings` },
    { done: Boolean(settings?.codEnabled || paymentConnection), label: "Set up a way to get paid", href: `/${store.slug}/settings` },
    { done: orderCount > 0, label: "Share your link and get your first order", href: storeUrl, external: true },
  ];
  const showChecklist = checklist.some((c) => !c.done);

  return (
    <div className="space-y-8">
      {searchParams.published && (
        <div className="flex items-start gap-3 rounded-md border border-success/25 bg-success-soft px-4 py-3 text-small text-success" role="status">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Your store is live at <span className="font-semibold">{storeUrl.replace(/^https?:\/\//, "")}</span>. Share it on Instagram or WhatsApp to
            get your first order.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-title text-primary">
            {greeting()}, {firstName}
          </h1>
          <p className="mt-1 text-body text-muted">Overview of {store.name}&apos;s activity.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Date range" className="inline-flex rounded border border-border bg-surface p-0.5">
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
          <CopyLinkButton url={storeUrl} label="Copy link" />
        </div>
      </div>

      {showChecklist && (
        <Card className="p-0 sm:p-0">
          <div className="border-b border-border px-5 py-4 sm:px-6">
            <p className="text-[15px] font-semibold tracking-tight text-primary">Get your store ready</p>
            <p className="text-small text-muted">
              {checklist.filter((c) => c.done).length} of {checklist.length} complete
            </p>
          </div>
          <ul className="divide-y divide-border">
            {checklist.map((c) => {
              const inner = (
                <>
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                      c.done ? "border-success bg-success text-white" : "border-border-strong text-transparent"
                    )}
                    aria-hidden="true"
                  >
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  <span className={cn("flex-1 text-[14px]", c.done ? "text-muted line-through decoration-border-strong" : "font-medium text-primary")}>
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
            <Link href={`/${store.slug}/products/new`} className={buttonVariants({})}>
              <Plus className="h-4 w-4" /> Add product
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <StatCard label="Revenue" value={money(current.revenue)} {...comparison(current.revenue, previous.revenue, days)} />
            <StatCard label="Orders" value={current.orders.toLocaleString("en-IN")} {...comparison(current.orders, previous.orders, days)} />
            <StatCard label="New customers" value={current.customers.toLocaleString("en-IN")} {...comparison(current.customers, previous.customers, days)} />
            <StatCard
              label="Avg. order value"
              value={money(current.averageOrderValue)}
              {...comparison(current.averageOrderValue, previous.averageOrderValue, days)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <div>
                  <CardTitle>Revenue</CardTitle>
                  <p className="mt-0.5 text-small text-muted">Last {days} days</p>
                </div>
              </CardHeader>
              <RevenueChart data={revenueByDay} />
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Store performance</CardTitle>
              </CardHeader>
              <dl className="space-y-4">
                <div>
                  <dt className="text-small text-muted">Conversion rate</dt>
                  <dd className="tabular mt-1 text-[26px] font-semibold leading-none tracking-tight text-primary">{funnel.conversionRate.toFixed(1)}%</dd>
                </div>
                <div className="space-y-2.5 border-t border-border pt-4 text-small">
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
                <Table>
                  <Thead>
                    <Tr>
                      <Th>Order</Th>
                      <Th>Customer</Th>
                      <Th>Amount</Th>
                      <Th>Status</Th>
                    </Tr>
                  </Thead>
                  <tbody>
                    {recentOrders.map((o) => (
                      <Tr key={o.id}>
                        <Td>
                          <Link href={`/${store.slug}/orders/${o.id}`} className="font-medium text-primary hover:text-brand">
                            #{o.orderNumber}
                          </Link>
                        </Td>
                        <Td className="text-muted">{o.customerName}</Td>
                        <Td className="tabular">{money(Number(o.total))}</Td>
                        <Td>
                          <Badge variant={orderStatusVariant(o.status)}>{orderStatusLabel(o.status)}</Badge>
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Top products</CardTitle>
              </CardHeader>
              {topProducts.length === 0 ? (
                <p className="text-small text-muted">No sales in this period yet.</p>
              ) : (
                <ol className="space-y-3.5">
                  {topProducts.map((p, i) => (
                    <li key={p.productId ?? p.title} className="flex items-center gap-3 text-small">
                      <span className="tabular w-4 text-subtle">{i + 1}</span>
                      <span className="min-w-0 flex-1 truncate text-primary">{p.title}</span>
                      <span className="tabular text-muted">{p.unitsSold} sold</span>
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
