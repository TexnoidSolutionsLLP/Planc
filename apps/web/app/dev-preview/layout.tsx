import { notFound } from "next/navigation";
import { DashboardShell } from "../[store]/_components/dashboard-shell";
import { DEMO_ORDERS, DEMO_STORE } from "./fixtures";

/**
 * UI-only preview of the merchant dashboard on made-up data. It needs no
 * login, database or Supabase keys, and exists only under `pnpm dev`.
 * It never authenticates anyone: real pages still check the session.
 */
export default function DevPreviewLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV !== "development") notFound();
  return (
    <DashboardShell
      store={{ ...DEMO_STORE, status: "PUBLISHED" }}
      stores={[DEMO_STORE]}
      user={{ name: "Priya Sharma", email: "priya@example.test" }}
      recentOrders={DEMO_ORDERS.slice(0, 4).map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        status: o.status,
        total: Number(o.total),
        createdAt: o.createdAt.toISOString(),
      }))}
      newOrderCount={2}
      storefrontUrl="http://localhost:3001"
    >
      <p className="mb-6 text-small text-muted" role="note">
        <strong className="font-medium text-primary">UI preview.</strong> Sample data only; changes are turned off.
      </p>
      {children}
    </DashboardShell>
  );
}
