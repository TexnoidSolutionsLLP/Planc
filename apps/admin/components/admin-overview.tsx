import Link from "next/link";
import {
  ChevronRight,
  CircleCheck,
  KeyRound,
  PencilLine,
  Store,
} from "lucide-react";
import { Badge } from "@sellly/ui";
import { inr as money } from "@/lib/plans";
import type { OverviewData } from "./overview-data";

const STATUS_VARIANT: Record<string, "success" | "error" | "default"> = {
  PUBLISHED: "success",
  SUSPENDED: "error",
  DRAFT: "default",
};

export function AdminOverview({
  data,
  basePath = "",
}: {
  data: OverviewData;
  basePath?: string;
}) {
  const { plans, mrr, days, stores } = data;
  const target = (path: string) => `${basePath}/${path}`;
  const sales = days.reduce((sum, day) => sum + day.paid + day.cod + day.other, 0);
  const salesOrders = days.reduce(
    (sum, day) => sum + day.paidCount + day.codCount + day.otherCount,
    0,
  );
  const orders = data.orderActivity.reduce((sum, item) => sum + item.count, 0);
  const delivered =
    data.orderActivity.find((item) => item.label === "Delivered")?.count ?? 0;
  const plural = (count: number, word: string) =>
    `${count} ${count === 1 ? word : `${word}s`}`;
  const stats = [
    {
      label: "Merchant sales",
      value: money(sales),
      note: plural(salesOrders, "order"),
      href: target("revenue"),
    },
    {
      label: "Stores",
      value: String(stores.total),
      note: `${stores.published} live`,
      href: target("stores"),
    },
    {
      label: "Orders",
      value: String(orders),
      note: `${delivered} delivered`,
      href: target("orders"),
    },
    {
      label: "Plan revenue",
      value: money(mrr),
      note: plans.map((plan) => `${plan.count} ${plan.label}`).join(" · "),
      href: target("revenue"),
    },
  ];
  const attention = [
    {
      count: stores.suspended,
      label: stores.suspended === 1 ? "store suspended" : "stores suspended",
      href: target("stores?status=SUSPENDED"),
      Icon: Store,
      tone: "error",
    },
    {
      count: stores.draft,
      label:
        stores.draft === 1 ? "store still in draft" : "stores still in draft",
      href: target("stores?status=DRAFT"),
      Icon: PencilLine,
      tone: "warning",
    },
    {
      count: data.activeGrants,
      label:
        data.activeGrants === 1
          ? "store access approval open"
          : "store access approvals open",
      href: target("access"),
      Icon: KeyRound,
      tone: "primary",
    },
  ].filter((item) => item.count > 0);
  return (
    <section className="demo-overview" aria-label="Platform overview">
      <header className="overview-header">
        <h1>Overview</h1>
        <p>{data.periodLabel}</p>
      </header>
      <ul className="overview-stats" aria-label="Platform at a glance">
        {stats.map(({ label, value, note, href }) => (
          <li key={label}>
            <Link href={href} className="stat-tile">
              <span className="stat-label">{label}</span>
              <strong className="stat-value">{value}</strong>
              <span className="stat-note">{note}</span>
              <ChevronRight size={16} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
      <div className="overview-columns">
        <section className="overview-panel attention-panel" aria-labelledby="attention-heading">
          <div className="panel-heading">
            <h2 id="attention-heading">Needs attention</h2>
          </div>
          {attention.length ? (
            <ul>
              {attention.map(({ count, label, href, Icon, tone }) => (
                <li key={label}>
                  <Link href={href} className={`attention-item ${tone}`}>
                    <span className="attention-icon">
                      <Icon size={16} aria-hidden="true" />
                    </span>
                    <span>
                      <strong>{count}</strong> {label}
                    </span>
                    <ChevronRight size={16} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="attention-clear">
              <CircleCheck size={16} aria-hidden="true" /> Nothing needs your
              attention right now.
            </p>
          )}
        </section>
        <section className="overview-panel" aria-labelledby="new-stores-heading">
          <div className="panel-heading">
            <h2 id="new-stores-heading">New stores</h2>
            <Link href={target("stores")}>View all</Link>
          </div>
          {data.newStores.length ? (
            <ul className="store-rows">
              {data.newStores.map((store) => (
                <li key={store.id}>
                  <Link href={target(`stores/${store.id}`)} className="store-row">
                    <span className="store-row-name">
                      <strong>{store.name}</strong>
                      <span>{store.owner ?? "No owner"}</span>
                    </span>
                    <Badge variant={STATUS_VARIANT[store.status] ?? "default"}>
                      {store.status.charAt(0) + store.status.slice(1).toLowerCase()}
                    </Badge>
                    <time>{store.joined}</time>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="attention-clear">No stores yet.</p>
          )}
        </section>
      </div>
    </section>
  );
}
