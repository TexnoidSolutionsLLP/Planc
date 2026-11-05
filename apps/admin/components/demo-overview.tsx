import { AdminOverview } from "./admin-overview";
import { GRANTS, ORDERS, STORES } from "@/app/demo/sample-data";
import { PLAN_PRICE } from "@/lib/plans";

/** dd/mm/yyyy → yyyy-mm-dd, so fixture dates sort and parse. */
const sortable = (date: string) => date.split("/").reverse().join("-");

/** Fixtures feed the same presentation used by the authenticated admin dashboard. */
export function DemoOverview() {
  const valid = ORDERS.filter((order) => order.status !== "CANCELLED");
  const dates = ["01/11/2026", "02/11/2026", "03/11/2026"];
  return (
    <AdminOverview
      basePath="/demo"
      data={{
        name: "Demo admin",
        sample: true,
        periodLabel: "1–3 Nov 2026",
        days: dates.map((key, index) => {
          const orders = valid.filter((order) => order.date === key);
          const paid = orders.filter((order) => order.payment.includes("PAID"));
          const cod = orders.filter((order) => order.payment.includes("COD"));
          return {
            key,
            label: `${index + 1} Nov`,
            paid: paid.reduce((sum, order) => sum + order.total, 0),
            cod: cod.reduce((sum, order) => sum + order.total, 0),
            other: 0,
            paidCount: paid.length,
            codCount: cod.length,
            otherCount: 0,
          };
        }),
        stores: {
          total: STORES.length,
          published: STORES.filter((store) => store.status === "PUBLISHED")
            .length,
          draft: STORES.filter((store) => store.status === "DRAFT").length,
          suspended: STORES.filter((store) => store.status === "SUSPENDED")
            .length,
        },
        plans: ["FREE", "PRO", "BUSINESS"].map((plan) => ({
          label: plan[0] + plan.slice(1).toLowerCase(),
          count: STORES.filter((store) => store.plan === plan).length,
        })),
        mrr: STORES.reduce((sum, store) => sum + PLAN_PRICE[store.plan], 0),
        paidPlans: STORES.filter((store) => store.plan !== "FREE").length,
        activeGrants: GRANTS.filter((grant) => grant.status === "ACTIVE")
          .length,
        orderActivity: [
          { label: "Confirmed", status: "CONFIRMED", color: "var(--order-confirmed)" },
          { label: "Delivered", status: "DELIVERED", color: "var(--order-delivered)" },
          { label: "Shipped", status: "SHIPPED", color: "var(--order-shipped)" },
        ].map((item) => ({
          ...item,
          count: ORDERS.filter((order) => order.status === item.status).length,
        })),
        cancelledOrders: ORDERS.filter((order) => order.status === "CANCELLED")
          .length,
        newStores: [...STORES]
          .sort((a, b) => sortable(b.joined).localeCompare(sortable(a.joined)))
          .slice(0, 5)
          .map((store) => ({
            id: store.id,
            name: store.name,
            owner: store.owner,
            status: store.status,
            joined: new Date(sortable(store.joined)).toLocaleDateString(
              "en-IN",
              { day: "numeric", month: "short", timeZone: "UTC" },
            ),
          })),
      }}
    />
  );
}
