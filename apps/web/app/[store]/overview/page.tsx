import { prisma } from "@sellly/database";
import { storeUrl as storeUrlFor } from "@sellly/domains";
import { getConversionFunnel, getRevenueByDay, getStoreOverview, getTopProducts } from "@sellly/analytics";
import { requireStore, requireUser } from "@/lib/session";
import { OverviewView } from "./overview-view";

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
    prisma.order.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.product.count({ where: { storeId: store.id } }),
    prisma.storeSettings.findUnique({ where: { storeId: store.id } }),
    prisma.paymentConnection.findFirst({
      where: { storeId: store.id, isActive: true },
    }),
  ]);

  const orderCount = await prisma.order.count({ where: { storeId: store.id } });
  const storeUrl = storeUrlFor(store.slug);
  const firstName = (user.name ?? user.email.split("@")[0]).split(" ")[0];

  const checklist = [
    {
      done: productCount > 0,
      label: "Add your first product",
      href: `/${store.slug}/products/new`,
    },
    {
      done: store.status === "PUBLISHED",
      label: "Publish your store",
      href: `/${store.slug}/settings`,
    },
    {
      done: Boolean(settings?.codEnabled || paymentConnection),
      label: "Set up a way to get paid",
      href: `/${store.slug}/settings`,
    },
    {
      done: orderCount > 0,
      label: "Share your link and get your first order",
      href: storeUrl,
      external: true,
    },
  ];

  return (
    <OverviewView
      store={{ slug: store.slug, name: store.name }}
      firstName={firstName}
      days={days}
      storeUrl={storeUrl}
      published={Boolean(searchParams.published)}
      current={current}
      previous={previous}
      topProducts={topProducts}
      revenueByDay={revenueByDay}
      funnel={funnel}
      recentOrders={recentOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        status: o.status,
        total: Number(o.total),
      }))}
      productCount={productCount}
      checklist={checklist}
    />
  );
}
