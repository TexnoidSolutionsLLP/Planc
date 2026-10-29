import Link from "next/link";
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
  const { store, userId, membership, user: profile } = await requireStore(params.store);
  const user = await requireUser();
  const isOwner = membership.role === "OWNER" && profile.platformRole === "MERCHANT";

  const [memberships, recentOrders, newOrderCount, pendingAccessCount] = await Promise.all([
    prisma.storeMember.findMany({ where: { userId }, include: { store: true } }),
    prisma.order.findMany({ where: { storeId: store.id }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.order.count({ where: { storeId: store.id, status: { in: ["PENDING", "CONFIRMED"] } } }),
    isOwner ? prisma.accessRequest.count({ where: { storeId: store.id, status: "PENDING" } }) : Promise.resolve(0),
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
      pendingAccessCount={pendingAccessCount}
    >
      {store.status === "SUSPENDED" && (
        <div className="mb-6 rounded-lg border border-error/30 bg-error-soft px-4 py-3 text-small text-primary" role="alert">
          This store is suspended and not visible to customers.{store.suspendedReason ? ` Reason: ${store.suspendedReason}.` : ""} Contact Sellly support for help.
        </div>
      )}
      {pendingAccessCount > 0 && (
        <Link
          href={`/${store.slug}/access`}
          className="mb-6 block rounded-lg border border-warning/30 bg-warning-soft px-4 py-3 text-small text-primary"
        >
          Sellly support has asked for access to your store ({pendingAccessCount} pending). Nothing is shared until you approve.{" "}
          <span className="font-medium underline">Review requests</span>
        </Link>
      )}
      {children}
    </DashboardShell>
  );
}
