import { prisma } from "@sellly/database";
import { requireStore, requireUser } from "@/lib/session";
import { DashboardShell } from "./_components/dashboard-shell";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { store: string };
}) {
  const { store, userId } = await requireStore(params.store);
  const user = await requireUser();

  const [memberships, recentOrders, newOrderCount] = await Promise.all([
    prisma.storeMember.findMany({ where: { userId }, include: { store: true } }),
    prisma.order.findMany({ where: { storeId: store.id }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.order.count({ where: { storeId: store.id, status: { in: ["PENDING", "CONFIRMED"] } } }),
  ]);

  return (
    <DashboardShell
      store={{ slug: store.slug, name: store.name, status: store.status }}
      stores={memberships.map((m) => ({ slug: m.store.slug, name: m.store.name }))}
      user={{ name: user.name ?? user.email.split("@")[0], email: user.email }}
      recentOrders={recentOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        status: o.status,
        total: Number(o.total),
        createdAt: o.createdAt.toISOString(),
      }))}
      newOrderCount={newOrderCount}
      storefrontUrl={process.env.STOREFRONT_URL ?? "http://localhost:3001"}
    >
      {children}
    </DashboardShell>
  );
}
