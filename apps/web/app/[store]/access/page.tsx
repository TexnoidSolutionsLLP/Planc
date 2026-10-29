import { ACCESS_SCOPES, displayStatus, prisma, type DisplayStatus } from "@sellly/database";
import { Badge, Button, Card, CardDescription, CardHeader, CardTitle, EmptyState, Input, Label, Table, Thead, Th, Tr, Td } from "@sellly/ui";
import { requireStore } from "@/lib/session";
import { approveAccessAction, rejectAccessAction, revokeAccessAction } from "@/lib/actions/access";
import { ConfirmAction } from "../_components/confirm-action";

const STATUS_VARIANT: Record<DisplayStatus, "default" | "success" | "warning" | "error"> = {
  PENDING: "warning",
  ACTIVE: "success",
  EXPIRED: "default",
  REJECTED: "error",
  REVOKED: "default",
  CANCELLED: "default",
};

const ERRORS: Record<string, string> = {
  CONFIRM_MODIFY: "To let Sellly staff make changes, tick the confirmation box as well.",
  NOT_PENDING: "That request was already decided.",
  NOT_ACTIVE: "That access had already ended.",
  NOT_OWNER: "Only the store owner can do that.",
  SELF_DECISION: "You can't decide your own request.",
  INVALID: "Approve at least one of the requested permissions, or reject the request.",
  NOT_FOUND: "That request no longer exists.",
};

const DONE: Record<string, string> = {
  approved: "Access approved. It ends automatically at the time shown, or when you revoke it.",
  rejected: "Request rejected. Sellly staff can't see or change that information.",
  revoked: "Access revoked. It stopped working immediately.",
};

function hours(h: number) {
  if (h % 24 === 0) return `${h / 24} day${h === 24 ? "" : "s"}`;
  return `${h} hour${h === 1 ? "" : "s"}`;
}

function levels(view: boolean, modify: boolean) {
  return [view && "View", modify && "Make changes"].filter(Boolean).join(" + ") || "—";
}

export default async function SelllyAccessPage({ params, searchParams }: { params: { store: string }; searchParams: { error?: string; done?: string } }) {
  const { store, membership, user } = await requireStore(params.store);
  const isOwner = membership.role === "OWNER" && user.platformRole === "MERCHANT";

  if (!isOwner) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-title text-primary">Sellly access</h1>
        <EmptyState
          title="Only the store owner can manage Sellly access"
          description="Requests from Sellly support to see or change this store's information go to the store owner, who approves or rejects them."
        />
      </div>
    );
  }

  const requests = await prisma.accessRequest.findMany({
    where: { storeId: store.id },
    include: { requestedBy: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const now = new Date();
  const pending = requests.filter((r) => r.status === "PENDING");
  const active = requests.filter((r) => displayStatus(r, now) === "ACTIVE");
  const history = requests.filter((r) => r.status !== "PENDING" && displayStatus(r, now) !== "ACTIVE");

  const activity = await prisma.auditLog.findMany({
    where: {
      storeId: store.id,
      OR: [{ action: { startsWith: "access." } }, { action: { startsWith: "staff." } }, { action: { startsWith: "support." } }],
    },
    include: { user: { select: { name: true, email: true, platformRole: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-title text-primary">Sellly access</h1>
        <p className="text-body text-muted">
          Sellly staff can&apos;t see your orders, customers or store details, or change anything, unless you approve it here. Every
          approval is limited to one area and ends automatically.
        </p>
      </div>

      {searchParams.error && <p className="text-small text-error">{ERRORS[searchParams.error] ?? "Something went wrong. Try again."}</p>}
      {searchParams.done && DONE[searchParams.done] && <p className="text-small text-success">{DONE[searchParams.done]}</p>}

      <section className="space-y-3">
        <h2 className="text-h3 text-primary">Waiting for you ({pending.length})</h2>
        {pending.length === 0 && <p className="text-small text-muted">No pending requests.</p>}
        {pending.map((r) => {
          const scope = ACCESS_SCOPES[r.scope];
          return (
            <Card key={r.id}>
              <CardHeader>
                <CardTitle>{scope.label}</CardTitle>
                <CardDescription className="mt-0.5">
                  Requested by {r.requestedBy.name ?? r.requestedBy.email} ({r.requestedBy.email}) on {r.createdAt.toLocaleString("en-IN")} · for {hours(r.durationHours)}
                </CardDescription>
              </CardHeader>
              <p className="text-small text-primary">
                <span className="font-medium">Reason:</span> {r.reason}
              </p>
              <form className="mt-4 space-y-3">
                <fieldset className="space-y-2">
                  <legend className="mb-1 text-small font-medium text-primary">What do you allow?</legend>
                  {r.requestedView && (
                    <label className="flex items-start gap-2 text-small">
                      <input type="checkbox" name="grantView" defaultChecked className="mt-0.5 h-4 w-4 accent-brand" />
                      <span>
                        <span className="font-medium">View</span> — {scope.view}
                      </span>
                    </label>
                  )}
                  {r.requestedModify && (
                    <label className="flex items-start gap-2 text-small">
                      <input type="checkbox" name="grantModify" className="mt-0.5 h-4 w-4 accent-brand" />
                      <span>
                        <span className="font-medium">Make changes</span> — {scope.modify}
                      </span>
                    </label>
                  )}
                  {r.requestedModify && (
                    <label className="ml-6 flex items-start gap-2 text-caption text-muted">
                      <input type="checkbox" name="confirmModify" className="mt-0.5 h-4 w-4 accent-brand" />
                      <span>If allowing changes: I understand Sellly staff will be able to make the change described above until this access ends.</span>
                    </label>
                  )}
                </fieldset>
                <div className="space-y-1.5">
                  <Label htmlFor={`note-${r.id}`}>Note (optional)</Label>
                  <Input id={`note-${r.id}`} name="note" maxLength={1000} placeholder="Shown to Sellly staff" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" size="sm" formAction={approveAccessAction.bind(null, store.slug, r.id)}>
                    Approve selected
                  </Button>
                  <Button type="submit" size="sm" variant="secondary" formAction={rejectAccessAction.bind(null, store.slug, r.id)}>
                    Reject
                  </Button>
                </div>
              </form>
            </Card>
          );
        })}
      </section>

      <section className="space-y-3">
        <h2 className="text-h3 text-primary">Active access ({active.length})</h2>
        {active.length === 0 ? (
          <p className="text-small text-muted">Sellly staff currently have no access to this store&apos;s protected information.</p>
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Staff member</Th>
                <Th>Area</Th>
                <Th>Allowed</Th>
                <Th>Ends</Th>
                <Th>
                  <span className="sr-only">Revoke</span>
                </Th>
              </Tr>
            </Thead>
            <tbody>
              {active.map((r) => (
                <Tr key={r.id}>
                  <Td>{r.requestedBy.name ?? r.requestedBy.email}</Td>
                  <Td>{ACCESS_SCOPES[r.scope].label}</Td>
                  <Td>{levels(r.grantedView, r.grantedModify)}</Td>
                  <Td className="text-muted">{r.expiresAt?.toLocaleString("en-IN")}</Td>
                  <Td>
                    <ConfirmAction
                      action={revokeAccessAction.bind(null, store.slug, r.id)}
                      triggerLabel="Revoke"
                      title="Revoke this access now?"
                      description="Sellly staff lose this access immediately. They can ask again if they still need it."
                      confirmLabel="Revoke access"
                    />
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-h3 text-primary">Past requests</h2>
        {history.length === 0 ? (
          <p className="text-small text-muted">None yet.</p>
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Requested</Th>
                <Th>Staff member</Th>
                <Th>Area</Th>
                <Th>Asked for</Th>
                <Th>Outcome</Th>
              </Tr>
            </Thead>
            <tbody>
              {history.map((r) => {
                const status = displayStatus(r, now);
                return (
                  <Tr key={r.id}>
                    <Td className="text-muted">{r.createdAt.toLocaleDateString("en-IN")}</Td>
                    <Td>{r.requestedBy.name ?? r.requestedBy.email}</Td>
                    <Td>{ACCESS_SCOPES[r.scope].label}</Td>
                    <Td>{levels(r.requestedView, r.requestedModify)}</Td>
                    <Td>
                      <Badge variant={STATUS_VARIANT[status]}>{status.charAt(0) + status.slice(1).toLowerCase()}</Badge>
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-h3 text-primary">What Sellly staff did</h2>
        <p className="text-small text-muted">Every request, decision, and every time staff viewed or changed your store&apos;s information.</p>
        {activity.length === 0 ? (
          <p className="text-small text-muted">No activity yet.</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
            {activity.map((a) => (
              <li key={a.id} className="flex flex-wrap justify-between gap-2 px-4 py-2.5 text-small">
                <span>
                  <span className="font-medium text-primary">{describeAction(a.action)}</span>
                  <span className="text-muted">
                    {" "}
                    · {a.user ? `${a.user.name ?? a.user.email}${a.user.platformRole === "PLATFORM_ADMIN" ? " (Sellly staff)" : ""}` : "System"}
                  </span>
                  {describeMeta(a.metadata) && <span className="text-muted"> · {describeMeta(a.metadata)}</span>}
                </span>
                <span className="text-caption text-muted">{a.createdAt.toLocaleString("en-IN")}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

const ACTION_LABELS: Record<string, string> = {
  "access.requested": "Access requested",
  "access.approved": "Access approved",
  "access.rejected": "Access rejected",
  "access.revoked": "Access revoked",
  "access.relinquished": "Staff ended their access early",
  "access.cancelled": "Request withdrawn",
  "support.viewed": "Staff viewed store information",
  "support.store_suspended": "Store suspended by staff",
  "support.store_reactivated": "Store reactivated by staff",
  "support.plan_changed": "Plan changed by staff",
  "support.order_status_changed": "Order status changed by staff",
  "support.account_suspended": "Owner account suspended by staff",
  "support.account_reactivated": "Owner account reactivated by staff",
};

function describeAction(action: string) {
  return ACTION_LABELS[action] ?? action;
}

function describeMeta(meta: unknown) {
  if (!meta || typeof meta !== "object") return "";
  const m = meta as Record<string, unknown>;
  const scope = typeof m.scope === "string" && m.scope in ACCESS_SCOPES ? ACCESS_SCOPES[m.scope as keyof typeof ACCESS_SCOPES].label : null;
  const parts = [scope, typeof m.section === "string" ? m.section : null, typeof m.from === "string" && typeof m.to === "string" ? `${m.from} → ${m.to}` : null];
  return parts.filter(Boolean).join(" · ");
}
