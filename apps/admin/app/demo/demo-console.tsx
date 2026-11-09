"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DemoOverview } from "@/components/demo-overview";
import { useEffect, useState, type ReactNode } from "react";
import {
  Badge,
  Button,
  Card,
  Input,
  Select,
  Table,
  Thead,
  Th,
  Tr,
  Td,
} from "@sellly/ui";
import { AUDIT, GRANTS, ORDERS, STORES, money, storeName } from "./sample-data";

function Status({ value }: { value: string }) {
  const variant = ["ACTIVE", "PUBLISHED", "DELIVERED", "PAID"].includes(value)
    ? "success"
    : ["SUSPENDED", "CANCELLED"].includes(value)
      ? "error"
      : value === "PENDING"
        ? "warning"
        : "default";
  return (
    <Badge variant={variant}>
      {value.charAt(0) + value.slice(1).toLowerCase()}
    </Badge>
  );
}

function DemoTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: ReactNode[][];
}) {
  return (
    <div className="demo-stack">
      <Table containerLabel={`${columns.join(", ")} table`}>
        <Thead>
          <Tr>
            {columns.map((column) => (
              <Th
                key={column}
                className={
                  [
                    "Total",
                    "Total sales",
                    "Sales",
                    "Products",
                    "Orders",
                  ].includes(column)
                    ? "text-right"
                    : undefined
                }
              >
                {column}
              </Th>
            ))}
          </Tr>
        </Thead>
        <tbody>
          {rows.length ? (
            rows.map((row, index) => (
              <Tr key={index}>
                {row.map((cell, cellIndex) => (
                  <Td
                    key={cellIndex}
                    data-label={columns[cellIndex]}
                    className={
                      typeof cell === "number" ||
                      (typeof cell === "string" && /^(₹|\d+$)/.test(cell))
                        ? "text-right tabular"
                        : undefined
                    }
                  >
                    {cell}
                  </Td>
                ))}
              </Tr>
            ))
          ) : (
            <Tr>
              <Td colSpan={columns.length} className="text-muted">
                No results. Try a different name, or clear the search.
              </Td>
            </Tr>
          )}
        </tbody>
      </Table>
    </div>
  );
}

function StoreLink({ id }: { id: string }) {
  return (
    <Link href={`/demo/stores/${id}`} className="font-medium hover:underline">
      {storeName(id)}
    </Link>
  );
}

function Metrics({
  items,
}: {
  items: { label: string; value: string | number; note?: string }[];
}) {
  return (
    <div className="metric-grid grid gap-4 sm:grid-cols-3">
      {items.map((item) => (
        <Card key={item.label}>
          <p className="text-small text-muted">{item.label}</p>
          <p className="mt-1 text-h2 text-primary">{item.value}</p>
          {item.note && (
            <p className="mt-1 text-caption text-muted">{item.note}</p>
          )}
        </Card>
      ))}
    </div>
  );
}

const TITLES: Record<string, { title: string; description?: string }> = {
  merchants: {
    title: "Merchants",
    description: "Store sales need the owner's approval.",
  },
  stores: { title: "Stores" },
  orders: {
    title: "Orders",
    description: "Shown only for stores whose owner approved your access.",
  },
  revenue: {
    title: "Revenue",
    description:
      "Sellly's subscription revenue and merchants' sales are separate.",
  },
  access: {
    title: "My access",
    description:
      "Only a store owner can approve access. Approvals end automatically.",
  },
  audit: { title: "Audit history" },
  health: { title: "System health" },
};

export function DemoConsole({
  section,
  storeId,
}: {
  section: string;
  storeId?: string;
}) {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [search, setSearch] = useState(initialQuery);
  useEffect(() => {
    setQuery(initialQuery);
    setSearch(initialQuery);
  }, [initialQuery]);
  const initialStatus = searchParams.get("status") ?? "";
  const [status, setStatus] = useState(initialStatus);
  const [filterStatus, setFilterStatus] = useState(initialStatus);
  const currentStore = STORES.find((store) => store.id === storeId);
  const matches = (values: string[]) =>
    values.join(" ").toLowerCase().includes(search.trim().toLowerCase());
  const title = TITLES[section];
  const storeOrders = currentStore
    ? ORDERS.filter((order) => order.store === currentStore.id)
    : [];
  const successfulOrders = ORDERS.filter(
    (order) => order.status !== "CANCELLED",
  );
  const price = { FREE: 0, PRO: 999, BUSINESS: 2499 };
  const mrr = STORES.reduce(
    (total, store) => total + price[store.plan as keyof typeof price],
    0,
  );
  const allowedOrderStores = GRANTS.filter(
    (grant) => grant.area === "Orders" && grant.status === "ACTIVE",
  ).map((grant) => grant.store);
  const orderRows = ORDERS.filter((order) =>
    allowedOrderStores.includes(order.store),
  );
  const canViewDetails = (id: string) =>
    GRANTS.some(
      (grant) =>
        grant.store === id &&
        grant.area === "Store details" &&
        grant.status === "ACTIVE",
    );

  const filters = (isStore: boolean) => (
    <form
      className="demo-filters flex flex-wrap"
      onSubmit={(event) => {
        event.preventDefault();
        setSearch(query);
        setFilterStatus(status);
      }}
    >
      <Input
        name="q"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={isStore ? "Search stores" : "Search merchants"}
        className="h-9 min-w-0 flex-1 sm:w-64 sm:flex-none"
        aria-label={isStore ? "Search stores" : "Search merchants"}
      />
      {isStore && (
        <Select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="h-9 w-auto"
          aria-label="Status"
        >
          <option value="">All statuses</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
          <option value="SUSPENDED">Suspended</option>
        </Select>
      )}
      <Button type="submit" size="sm" variant="secondary">
        {isStore ? "Apply filters" : "Search"}
      </Button>
      {(search || filterStatus) && (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => {
            setQuery("");
            setSearch("");
            setStatus("");
            setFilterStatus("");
          }}
        >
          Clear
        </Button>
      )}
    </form>
  );
  const ordersTable = (rows: typeof ORDERS) => (
    <DemoTable
      columns={[
        "Order",
        "Store",
        "Customer",
        "Total",
        "Status",
        "Payment",
        "Placed",
      ]}
      rows={rows.map((order) => [
        <details key="detail">
          <summary className="order-summary cursor-pointer font-medium">#{order.id}</summary>
          <p className="mt-2 max-w-48 text-caption text-muted">
            {storeName(order.store)} · {money(order.total)}
          </p>
        </details>,
        <StoreLink key="store" id={order.store} />,
        order.customer,
        money(order.total),
        <Status key="status" value={order.status} />,
        order.payment,
        order.date,
      ])}
    />
  );

  if (currentStore)
    return (
      <div className="space-y-6">
        <Link
          href="/demo/stores"
          className="back-link text-small text-brand hover:underline"
        >
          ← Back to stores
        </Link>
        <div>
          <h1 className="text-title text-primary">{currentStore.name}</h1>
          <p className="text-small text-muted">
            {currentStore.id}.sellly.example
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Status value={currentStore.status} />
          <Badge>{currentStore.plan}</Badge>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <h2 className="mb-4 text-h3">Store information</h2>
            <dl className="grid grid-cols-2 gap-3 text-small">
              <dt className="text-muted">Owner</dt>
              <dd>{currentStore.owner}</dd>
              <dt className="text-muted">Email</dt>
              <dd className="break-all">{currentStore.email}</dd>
              <dt className="text-muted">Created</dt>
              <dd>{currentStore.joined}</dd>
              <dt className="text-muted">Payments</dt>
              <dd>{currentStore.payment}</dd>
              <dt className="text-muted">Products</dt>
              <dd>{currentStore.products}</dd>
              <dt className="text-muted">Orders</dt>
              <dd>{storeOrders.length}</dd>
            </dl>
          </Card>
          <Card>
            <h2 className="mb-3 text-h3">Owner-approved access</h2>
            <p className="text-small text-muted">
              Protected store information needs the owner&apos;s approval.
            </p>
            <ul className="my-4 space-y-2">
              {GRANTS.filter((grant) => grant.store === currentStore.id).map(
                (grant) => (
                  <li
                    className="flex flex-wrap items-center justify-between gap-2 text-small"
                    key={grant.area}
                  >
                    <span>
                      {grant.area} · {grant.permission}
                    </span>
                    <Status value={grant.status} />
                  </li>
                ),
              )}
            </ul>
            <Button
              disabled
              variant="secondary"
              title="Requests are turned off in this sample"
            >
              Request access
            </Button>
          </Card>
        </div>
        <h2 className="text-h3">Orders</h2>
        {allowedOrderStores.includes(currentStore.id) ? (
          ordersTable(storeOrders)
        ) : (
          <Card>
            <p className="text-small text-muted">
              You don&apos;t have the owner&apos;s approval to see this
              store&apos;s orders.
            </p>
          </Card>
        )}
      </div>
    );

  return (
    <div className="space-y-6">
      {section === "overview" ? (
        <DemoOverview />
      ) : (
        <div>
          <h1 className="text-title text-primary">{title.title}</h1>
          {title.description && (
            <p className="text-body text-muted">{title.description}</p>
          )}
        </div>
      )}
      {section === "merchants" && (
        <section
          className="merchant-directory"
          aria-labelledby="merchant-directory-heading"
        >
          <h2 id="merchant-directory-heading" className="sr-only">
            Merchant list
          </h2>
          {filters(false)}
          <DemoTable
            columns={[
              "Name",
              "Contact",
              "Stores",
              "Registered",
              "Last active",
              "Total sales",
              "Status",
            ]}
            rows={STORES.filter((store) =>
              matches([store.owner, store.email]),
            ).map((store) => [
              store.owner,
              <span key="email" className="text-muted">
                {store.email}
              </span>,
              <StoreLink key="store" id={store.id} />,
              store.joined,
              store.lastActive,
              canViewDetails(store.id) ? (
                money(
                  successfulOrders
                    .filter((order) => order.store === store.id)
                    .reduce((total, order) => total + order.total, 0),
                )
              ) : (
                <span key="restricted" className="text-caption text-muted">
                  Needs approval
                </span>
              ),
              <Status key="status" value={store.account} />,
            ])}
          />
        </section>
      )}
      {section === "stores" && (
        <>
          {filters(true)}
          <DemoTable
            columns={[
              "Store",
              "Owner",
              "Status",
              "Plan",
              "Products",
              "Orders",
              "Payments",
              "Web address",
            ]}
            rows={STORES.filter(
              (store) =>
                matches([store.name, store.id]) &&
                (!filterStatus || store.status === filterStatus),
            ).map((store) => [
              <StoreLink key="store" id={store.id} />,
              <div key="owner">
                {store.owner}
                <span className="block text-caption text-muted">
                  {store.email}
                </span>
              </div>,
              <Status key="status" value={store.status} />,
              store.plan,
              store.products,
              ORDERS.filter((order) => order.store === store.id).length,
              store.payment,
              <span key="url" className="text-caption text-muted">
                {store.id}.sellly.example
              </span>,
            ])}
          />
        </>
      )}
      {section === "orders" && (
        <>
          <Metrics
            items={[
              { label: "Orders across all stores", value: ORDERS.length },
              {
                label: "Stores whose orders need approval",
                value: new Set(
                  ORDERS.filter(
                    (order) => !allowedOrderStores.includes(order.store),
                  ).map((order) => order.store),
                ).size,
              },
            ]}
          />
          {ordersTable(orderRows)}
        </>
      )}
      {section === "revenue" && (
        <>
          <h2 className="text-h3">Sellly subscription revenue</h2>
          <Metrics
            items={[
              {
                label: "Monthly recurring revenue",
                value: money(mrr),
                note: "List price of active paid plans, not collected cash.",
              },
              {
                label: "Past due",
                value: money(0),
              },
              { label: "Cancelled subscriptions", value: 0 },
            ]}
          />
          <Card>
            <h2 className="mb-4 text-h3">Plan distribution</h2>
            <ul className="space-y-5">
              {(["FREE", "PRO", "BUSINESS"] as const).map((plan) => {
                const count = STORES.filter(
                  (store) => store.plan === plan,
                ).length;
                return (
                  <li key={plan}>
                    <div className="flex justify-between text-small">
                      <span>
                        {plan} · {money(price[plan])}/mo
                      </span>
                      <span>
                        {count} {count === 1 ? "store" : "stores"}
                      </span>
                    </div>
                    <div className="mt-2 h-2 rounded bg-secondary">
                      <div
                        className="h-2 rounded bg-brand"
                        style={{ width: `${(count / STORES.length) * 100}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
          <h2 className="text-h3">Merchant sales processed (GMV)</h2>
          <Metrics
            items={[
              {
                label: "Merchant sales",
                value: money(
                  successfulOrders.reduce(
                    (total, order) => total + order.total,
                    0,
                  ),
                ),
                note: "Excludes cancelled orders.",
              },
              { label: "Included orders", value: successfulOrders.length },
              { label: "Stores", value: STORES.length },
            ]}
          />
          <DemoTable
            columns={["Store", "Orders", "Sales"]}
            rows={STORES.filter((store) =>
              successfulOrders.some((order) => order.store === store.id),
            ).map((store) => [
              <StoreLink key="store" id={store.id} />,
              successfulOrders.filter((order) => order.store === store.id)
                .length,
              canViewDetails(store.id)
                ? money(
                    successfulOrders
                      .filter((order) => order.store === store.id)
                      .reduce((total, order) => total + order.total, 0),
                  )
                : "Needs owner approval",
            ])}
          />
        </>
      )}
      {section === "access" && (
        <DemoTable
          columns={[
            "Store",
            "Area",
            "Asked / granted",
            "Status",
            "Ends (IST)",
            "Owner's note",
          ]}
          rows={GRANTS.map((grant) => [
            <StoreLink key="store" id={grant.store} />,
            grant.area,
            grant.permission,
            <Status key="status" value={grant.status} />,
            grant.ends,
            grant.note,
          ])}
        />
      )}
      {section === "audit" && (
        <DemoTable
          columns={["Time (IST)", "Staff", "Store", "Action", "Details"]}
          rows={AUDIT.map((entry) => [
            entry.time,
            "demo@example.test",
            <StoreLink key="store" id={entry.store} />,
            entry.action,
            entry.detail,
          ])}
        />
      )}
      {section === "health" && (
        <>
          <DemoTable
            columns={["Component", "Preview status", "Details"]}
            rows={[
              [
                "Admin frontend",
                <Badge key="ready" variant="success">
                  Available
                </Badge>,
                "Running locally with the same components as the live admin.",
              ],
              [
                "Database",
                "Not connected",
                "This demo reads only the bundled sample records.",
              ],
              [
                "Supabase Auth",
                "Not used",
                "Real admin routes still require a staff login.",
              ],
              [
                "Payments, shipping and storage",
                "Not contacted",
                "No external services are called by the preview.",
              ],
            ]}
          />
        </>
      )}
    </div>
  );
}
