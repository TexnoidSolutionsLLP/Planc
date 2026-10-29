import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ACCESS_DURATIONS_HOURS,
  ACCESS_SCOPES,
  getStaffAccessState,
  prisma,
  type AccessScope,
  type AccessState,
} from "@sellly/database";
import { Badge, Button, Card, CardDescription, CardHeader, CardTitle, Input, Label, Select, Table, Textarea, Thead, Th, Tr, Td } from "@sellly/ui";
import { requireAdmin } from "@/lib/require-admin";
import { accessStateMessage, gateView } from "@/lib/staff-access";
import {
  cancelRequestAction,
  changePlanAction,
  reactivateStoreAction,
  relinquishAccessAction,
  requestAccessAction,
  setOwnerAccountStatusAction,
  suspendStoreAction,
} from "@/lib/actions";
import { PLANS, inr } from "@/lib/plans";
import { Notice, Restricted } from "../../_components/notice";
import { liveUrl, paymentSetup } from "../../_components/store-info";

const SCOPES = Object.keys(ACCESS_SCOPES) as AccessScope[];
const TABS = [
  { key: "overview", label: "Overview" },
  { key: "store", label: "Store details", scope: "STORE" },
  { key: "orders", label: "Orders", scope: "ORDERS" },
  { key: "customers", label: "Customers", scope: "CUSTOMERS" },
  { key: "products", label: "Products", scope: "PRODUCTS" },
] as const;

const DONE: Record<string, string> = {
  requested: "Request sent. The store owner sees it in their dashboard; nothing is visible until they approve.",
  cancelled: "Request withdrawn.",
  relinquished: "You ended your access early.",
  suspended: "Store suspended. Customers can no longer reach it.",
  reactivated: "Store reactivated.",
  plan: "Plan changed.",
  account_suspended: "Owner account suspended.",
  account_reactivated: "Owner account reactivated.",
};

function stateBadge(state: AccessState) {
  if (state.allowed) return <Badge variant="success">Until {state.grant.expiresAt?.toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</Badge>;
  const variant = state.reason === "PENDING" ? "warning" : state.reason === "NONE" ? "default" : "error";
  const label = state.reason === "NONE" ? "No access" : state.reason.charAt(0) + state.reason.slice(1).toLowerCase();
  return <Badge variant={variant}>{label}</Badge>;
}

export default async function StoreDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { tab?: string; error?: string; done?: string };
}) {
  const staff = await requireAdmin();
  const store = await prisma.store.findUnique({
    where: { id: params.id },
    include: {
      subscription: true,
      storeSettings: { select: { codEnabled: true, onlinePaymentEnabled: true } },
      paymentConnections: { select: { provider: true, isActive: true } },
      domains: { select: { hostname: true, isSubdomain: true, status: true, isPrimary: true } },
      members: { include: { user: { select: { id: true, name: true, email: true, phone: true, status: true, platformRole: true } } } },
      _count: { select: { orders: true, products: true, customers: true } },
    },
  });
  if (!store) notFound();

  const tab = TABS.find((t) => t.key === searchParams.tab) ?? TABS[0];
  const owner = store.members.find((m) => m.role === "OWNER" && m.user.platformRole === "MERCHANT")?.user;
  const live = liveUrl(store.slug, store.domains);
  const payments = paymentSetup(store.storeSettings, store.paymentConnections);

  const states = Object.fromEntries(
    await Promise.all(
      SCOPES.map(async (scope) => [
        scope,
        {
          view: ACCESS_SCOPES[scope].view ? await getStaffAccessState(staff.id, store.id, scope, "view") : null,
          modify: ACCESS_SCOPES[scope].modify ? await getStaffAccessState(staff.id, store.id, scope, "modify") : null,
        },
      ])
    )
  ) as Record<AccessScope, { view: AccessState | null; modify: AccessState | null }>;

  const myRequests = await prisma.accessRequest.findMany({
    where: { storeId: store.id, requestedById: staff.id, OR: [{ status: "PENDING" }, { status: "APPROVED", expiresAt: { gt: new Date() } }] },
    orderBy: { createdAt: "desc" },
  });
  const activeViewGrants = SCOPES.filter((s) => states[s].view?.allowed);
  const returnTo = `/stores/${store.id}`;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/stores" className="text-caption text-muted hover:text-primary">
            ← Stores
          </Link>
          <h1 className="text-title text-primary">{store.name}</h1>
          <a href={live.url} target="_blank" rel="noopener noreferrer" className="text-small text-brand hover:underline">
            {live.url.replace(/^https?:\/\//, "")}
          </a>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={store.status === "PUBLISHED" ? "success" : store.status === "SUSPENDED" ? "error" : "default"}>{store.status}</Badge>
          <Badge>{store.subscription?.plan ?? "FREE"}</Badge>
        </div>
      </div>

      <Notice error={searchParams.error} done={searchParams.done} messages={DONE} />

      {activeViewGrants.length > 0 && (
        <div className="rounded-lg border border-brand/30 bg-brand-soft px-4 py-3 text-small text-primary" role="status">
          <span className="font-medium">Support session.</span> {owner?.name ?? "The store owner"} approved read access to{" "}
          {activeViewGrants.map((s) => ACCESS_SCOPES[s].label.toLowerCase()).join(", ")}. Each view is recorded in the store&apos;s activity log, which the owner can see. Access ends automatically.
        </div>
      )}

      <nav className="flex gap-1 overflow-x-auto border-b border-border" aria-label="Store sections">
        {TABS.map((t) => {
          const locked = "scope" in t && !states[t.scope].view?.allowed;
          return (
            <Link
              key={t.key}
              href={`?tab=${t.key}`}
              aria-current={t.key === tab.key ? "page" : undefined}
              className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-[14px] ${t.key === tab.key ? "border-brand font-medium text-primary" : "border-transparent text-muted hover:text-primary"}`}
            >
              {t.label}
              {locked && <span className="ml-1 text-caption">🔒</span>}
            </Link>
          );
        })}
      </nav>

      {tab.key === "overview" && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Platform overview</CardTitle>
                <CardDescription>Visible to all staff — no approval needed.</CardDescription>
              </CardHeader>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-small">
                <dt className="text-muted">Owner</dt>
                <dd>
                  {owner ? `${owner.name ?? "—"} · ${owner.email}` : "None"}
                  {owner?.phone && <span className="block text-caption text-muted">{owner.phone}</span>}
                  {owner && owner.status !== "ACTIVE" && <Badge variant="error" className="ml-1">{owner.status}</Badge>}
                </dd>
                <dt className="text-muted">Created</dt>
                <dd>{store.createdAt.toLocaleDateString("en-IN")}</dd>
                <dt className="text-muted">Published</dt>
                <dd>{store.publishedAt ? store.publishedAt.toLocaleDateString("en-IN") : "Never"}</dd>
                <dt className="text-muted">Products / orders / customers</dt>
                <dd>
                  {store._count.products} / {store._count.orders} / {store._count.customers}
                </dd>
                <dt className="text-muted">Payments</dt>
                <dd>{payments.label}</dd>
                <dt className="text-muted">Web address</dt>
                <dd>{live.custom ? "Own domain" : "Sellly address"}</dd>
                <dt className="text-muted">Subscription</dt>
                <dd>
                  {store.subscription?.plan ?? "FREE"} · {store.subscription?.status ?? "ACTIVE"}
                </dd>
                {store.status === "SUSPENDED" && (
                  <>
                    <dt className="text-muted">Suspended</dt>
                    <dd>
                      {store.suspendedAt?.toLocaleString("en-IN")} — {store.suspendedReason}
                    </dd>
                  </>
                )}
              </dl>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your access to this store</CardTitle>
                <CardDescription>Approved by the store owner, one area at a time.</CardDescription>
              </CardHeader>
              <table className="w-full text-small">
                <thead>
                  <tr className="text-left text-caption text-muted">
                    <th className="pb-1 font-medium">Area</th>
                    <th className="pb-1 font-medium">View</th>
                    <th className="pb-1 font-medium">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {SCOPES.map((scope) => (
                    <tr key={scope} className="border-t border-border">
                      <td className="py-1.5">{ACCESS_SCOPES[scope].label}</td>
                      <td className="py-1.5">{states[scope].view ? stateBadge(states[scope].view!) : <span className="text-muted">—</span>}</td>
                      <td className="py-1.5">{states[scope].modify ? stateBadge(states[scope].modify!) : <span className="text-muted">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {myRequests.length > 0 && (
                <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
                  {myRequests.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-2 text-caption">
                      <span>
                        {ACCESS_SCOPES[r.scope].label} · {r.status === "PENDING" ? "pending" : `active until ${r.expiresAt?.toLocaleString("en-IN")}`}
                      </span>
                      <form action={r.status === "PENDING" ? cancelRequestAction.bind(null, r.id, returnTo) : relinquishAccessAction.bind(null, r.id, returnTo)}>
                        <button type="submit" className="text-muted underline hover:text-primary">
                          {r.status === "PENDING" ? "Withdraw" : "End now"}
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Request access</CardTitle>
              <CardDescription>
                The owner{owner ? ` (${owner.email})` : ""} approves or rejects this in their dashboard. They can approve view without change, and revoke at any time.
              </CardDescription>
            </CardHeader>
            {!owner ? (
              <p className="text-small text-warning">This store has no merchant owner, so no one can approve access.</p>
            ) : (
              <form action={requestAccessAction.bind(null, store.id)} className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="scope">Area</Label>
                  <Select id="scope" name="scope" required defaultValue="">
                    <option value="" disabled>
                      Choose…
                    </option>
                    {SCOPES.map((s) => (
                      <option key={s} value={s}>
                        {ACCESS_SCOPES[s].label}
                        {ACCESS_SCOPES[s].view ? "" : " (change only)"}
                        {ACCESS_SCOPES[s].modify ? "" : " (view only)"}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="durationHours">For how long</Label>
                  <Select id="durationHours" name="durationHours" defaultValue="4">
                    {ACCESS_DURATIONS_HOURS.map((h) => (
                      <option key={h} value={h}>
                        {h < 24 ? `${h} hour${h === 1 ? "" : "s"}` : `${h / 24} day${h === 24 ? "" : "s"}`}
                      </option>
                    ))}
                  </Select>
                </div>
                <fieldset className="space-y-1.5 md:col-span-2">
                  <legend className="text-small font-medium text-primary">Permission</legend>
                  <label className="flex items-center gap-2 text-small">
                    <input type="checkbox" name="view" className="h-4 w-4 accent-brand" /> View
                  </label>
                  <label className="flex items-center gap-2 text-small">
                    <input type="checkbox" name="modify" className="h-4 w-4 accent-brand" /> Make changes
                  </label>
                  <p className="text-caption text-muted">
                    {SCOPES.map((s) => `${ACCESS_SCOPES[s].label}: ${[ACCESS_SCOPES[s].view && `view — ${ACCESS_SCOPES[s].view}`, ACCESS_SCOPES[s].modify && `change — ${ACCESS_SCOPES[s].modify}`].filter(Boolean).join("; ")}`).join(" · ")}
                  </p>
                </fieldset>
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="reason">Why do you need it? (the owner sees this)</Label>
                  <Textarea id="reason" name="reason" required minLength={10} maxLength={1000} placeholder="e.g. Customer says order #1042 was charged twice; need to check its payment status." />
                </div>
                <div className="md:col-span-2">
                  <Button type="submit">Send request</Button>
                </div>
              </form>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Store controls</CardTitle>
              <CardDescription>Each control needs an approved &ldquo;change&rdquo; permission and asks you to confirm.</CardDescription>
            </CardHeader>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <p className="text-small font-medium text-primary">{store.status === "SUSPENDED" ? "Reactivate store" : "Suspend store"}</p>
                {states.STORE.modify?.allowed ? (
                  <form action={(store.status === "SUSPENDED" ? reactivateStoreAction : suspendStoreAction).bind(null, store.id)} className="space-y-2">
                    {store.status !== "SUSPENDED" && <Input name="reason" required minLength={5} placeholder="Reason (the merchant sees this)" />}
                    <Input name="confirmText" required placeholder={`Type ${store.slug} to confirm`} aria-label="Confirmation" />
                    <Button type="submit" size="sm" variant={store.status === "SUSPENDED" ? "secondary" : "destructive"}>
                      {store.status === "SUSPENDED" ? "Reactivate" : "Suspend"}
                    </Button>
                  </form>
                ) : (
                  <p className="text-caption text-muted">{accessStateMessage(states.STORE.modify!, "STORE", "modify")}</p>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-small font-medium text-primary">Change plan</p>
                {states.BILLING.modify?.allowed ? (
                  <form action={changePlanAction.bind(null, store.id)} className="space-y-2">
                    <Select name="plan" defaultValue={store.subscription?.plan ?? "FREE"} aria-label="Plan">
                      {PLANS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </Select>
                    <label className="flex items-center gap-2 text-caption">
                      <input type="checkbox" name="confirm" className="h-4 w-4 accent-brand" /> I confirm this plan change
                    </label>
                    <Button type="submit" size="sm" variant="secondary">
                      Change plan
                    </Button>
                  </form>
                ) : (
                  <p className="text-caption text-muted">{accessStateMessage(states.BILLING.modify!, "BILLING", "modify")}</p>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-small font-medium text-primary">Owner account</p>
                {!owner ? (
                  <p className="text-caption text-muted">No owner.</p>
                ) : states.ACCOUNT.modify?.allowed ? (
                  <form action={setOwnerAccountStatusAction.bind(null, store.id, owner.id, owner.status === "ACTIVE")} className="space-y-2">
                    <p className="text-caption text-muted">Currently {owner.status.toLowerCase()}.</p>
                    <Input name="confirmText" required placeholder={`Type ${owner.email} to confirm`} aria-label="Confirmation" />
                    <Button type="submit" size="sm" variant={owner.status === "ACTIVE" ? "destructive" : "secondary"}>
                      {owner.status === "ACTIVE" ? "Suspend account" : "Reactivate account"}
                    </Button>
                  </form>
                ) : (
                  <p className="text-caption text-muted">{accessStateMessage(states.ACCOUNT.modify!, "ACCOUNT", "modify")}</p>
                )}
              </div>
            </div>
          </Card>
        </>
      )}

      {tab.key === "store" && <StoreDetailsTab staffId={staff.id} storeId={store.id} />}
      {tab.key === "orders" && <OrdersTab staffId={staff.id} storeId={store.id} />}
      {tab.key === "customers" && <CustomersTab staffId={staff.id} storeId={store.id} />}
      {tab.key === "products" && <ProductsTab staffId={staff.id} storeId={store.id} />}
    </div>
  );
}

async function StoreDetailsTab({ staffId, storeId }: { staffId: string; storeId: string }) {
  const state = await gateView(staffId, storeId, "STORE", "store details");
  if (!state.allowed) return <Restricted message={accessStateMessage(state, "STORE", "view")} />;

  const [settings, connections, sales, byStatus, activity] = await Promise.all([
    prisma.storeSettings.findUnique({ where: { storeId }, select: { address: true, supportEmail: true, supportPhone: true, codEnabled: true, onlinePaymentEnabled: true, whatsappEnabled: true } }),
    // Provider and status only — keys and secrets are never read here.
    prisma.paymentConnection.findMany({ where: { storeId }, select: { provider: true, isActive: true, updatedAt: true } }),
    prisma.order.aggregate({ where: { storeId, status: { notIn: ["CANCELLED", "FAILED", "REFUNDED", "RETURNED"] } }, _sum: { total: true }, _count: true }),
    prisma.order.groupBy({ by: ["status"], where: { storeId }, _count: true }),
    prisma.auditLog.findMany({ where: { storeId }, include: { user: { select: { email: true } } }, orderBy: { createdAt: "desc" }, take: 25 }),
  ]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Contact & address</CardTitle>
        </CardHeader>
        <dl className="grid grid-cols-2 gap-y-2 text-small">
          <dt className="text-muted">Address</dt>
          <dd>{settings?.address ?? "Not provided"}</dd>
          <dt className="text-muted">Support email</dt>
          <dd>{settings?.supportEmail ?? "—"}</dd>
          <dt className="text-muted">Support phone</dt>
          <dd>{settings?.supportPhone ?? "—"}</dd>
          <dt className="text-muted">WhatsApp updates</dt>
          <dd>{settings?.whatsappEnabled ? "On" : "Off"}</dd>
        </dl>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Sales & payments</CardTitle>
          <CardDescription>The merchant&apos;s sales, not Sellly revenue.</CardDescription>
        </CardHeader>
        <p className="text-h2 text-primary">{inr(Number(sales._sum.total ?? 0))}</p>
        <p className="text-caption text-muted">{sales._count} orders, excluding cancelled, failed, refunded and returned</p>
        <p className="mt-3 text-small">{byStatus.map((s) => `${s.status.toLowerCase().replace(/_/g, " ")}: ${s._count}`).join(" · ") || "No orders"}</p>
        <ul className="mt-3 space-y-1 border-t border-border pt-3 text-small">
          <li>Cash on delivery: {settings?.codEnabled ? "on" : "off"}</li>
          {connections.length === 0 && <li className="text-muted">No online payment provider connected.</li>}
          {connections.map((c) => (
            <li key={c.provider}>
              {c.provider}: {c.isActive ? "connected" : "inactive"} (updated {c.updatedAt.toLocaleDateString("en-IN")})
            </li>
          ))}
        </ul>
      </Card>
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Store activity</CardTitle>
        </CardHeader>
        <ul className="divide-y divide-border text-small">
          {activity.map((a) => (
            <li key={a.id} className="flex justify-between gap-2 py-1.5">
              <span>
                {a.action} <span className="text-muted">· {a.user?.email ?? "system"}</span>
              </span>
              <span className="text-caption text-muted">{a.createdAt.toLocaleString("en-IN")}</span>
            </li>
          ))}
          {activity.length === 0 && <li className="py-1.5 text-muted">No activity recorded.</li>}
        </ul>
      </Card>
    </div>
  );
}

async function OrdersTab({ staffId, storeId }: { staffId: string; storeId: string }) {
  const state = await gateView(staffId, storeId, "ORDERS", "orders");
  if (!state.allowed) return <Restricted message={accessStateMessage(state, "ORDERS", "view")} />;
  const orders = await prisma.order.findMany({ where: { storeId }, include: { payment: { select: { method: true, status: true } } }, orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <Table>
      <Thead>
        <Tr>
          <Th>Order</Th>
          <Th>Customer</Th>
          <Th>Total</Th>
          <Th>Status</Th>
          <Th>Payment</Th>
          <Th>Placed</Th>
        </Tr>
      </Thead>
      <tbody>
        {orders.map((o) => (
          <Tr key={o.id}>
            <Td>
              <Link href={`/stores/${storeId}/orders/${o.id}`} className="font-medium text-primary hover:underline">
                #{o.orderNumber}
              </Link>
            </Td>
            <Td>
              {o.customerName}
              <span className="block text-caption text-muted">{o.customerPhone}</span>
            </Td>
            <Td>{inr(Number(o.total))}</Td>
            <Td>
              <Badge>{o.status}</Badge>
            </Td>
            <Td className="text-small">{o.payment ? `${o.payment.method} · ${o.payment.status}` : <span className="text-muted">Not recorded</span>}</Td>
            <Td className="text-muted">{o.createdAt.toLocaleDateString("en-IN")}</Td>
          </Tr>
        ))}
        {orders.length === 0 && (
          <Tr>
            <Td colSpan={6} className="text-muted">
              No orders.
            </Td>
          </Tr>
        )}
      </tbody>
    </Table>
  );
}

async function CustomersTab({ staffId, storeId }: { staffId: string; storeId: string }) {
  const state = await gateView(staffId, storeId, "CUSTOMERS", "customers");
  if (!state.allowed) return <Restricted message={accessStateMessage(state, "CUSTOMERS", "view")} />;
  const customers = await prisma.customer.findMany({
    where: { storeId },
    include: { orders: { select: { total: true, status: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return (
    <Table>
      <Thead>
        <Tr>
          <Th>Name</Th>
          <Th>Contact</Th>
          <Th>Orders</Th>
          <Th>Spent</Th>
        </Tr>
      </Thead>
      <tbody>
        {customers.map((c) => (
          <Tr key={c.id}>
            <Td>{c.name}</Td>
            <Td className="text-muted">
              {c.phone}
              {c.email && <span className="block text-caption">{c.email}</span>}
            </Td>
            <Td>{c.orders.length}</Td>
            <Td>{inr(c.orders.filter((o) => !["CANCELLED", "FAILED", "REFUNDED", "RETURNED"].includes(o.status)).reduce((n, o) => n + Number(o.total), 0))}</Td>
          </Tr>
        ))}
        {customers.length === 0 && (
          <Tr>
            <Td colSpan={4} className="text-muted">
              No customers.
            </Td>
          </Tr>
        )}
      </tbody>
    </Table>
  );
}

async function ProductsTab({ staffId, storeId }: { staffId: string; storeId: string }) {
  const state = await gateView(staffId, storeId, "PRODUCTS", "products");
  if (!state.allowed) return <Restricted message={accessStateMessage(state, "PRODUCTS", "view")} />;
  const products = await prisma.product.findMany({ where: { storeId }, orderBy: { createdAt: "desc" }, take: 200 });
  return (
    <Table>
      <Thead>
        <Tr>
          <Th>Product</Th>
          <Th>Status</Th>
          <Th>Price</Th>
          <Th>Cost</Th>
          <Th>Inventory</Th>
        </Tr>
      </Thead>
      <tbody>
        {products.map((p) => (
          <Tr key={p.id}>
            <Td>{p.name}</Td>
            <Td>
              <Badge>{p.status}</Badge>
            </Td>
            <Td>{inr(Number(p.price))}</Td>
            <Td className="text-muted">{p.cost != null ? inr(Number(p.cost)) : "—"}</Td>
            <Td>{p.trackInventory ? p.inventoryQty : "Not tracked"}</Td>
          </Tr>
        ))}
        {products.length === 0 && (
          <Tr>
            <Td colSpan={5} className="text-muted">
              No products.
            </Td>
          </Tr>
        )}
      </tbody>
    </Table>
  );
}
