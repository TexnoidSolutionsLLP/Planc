import { ACCESS_SCOPES, getStaffAccessState, prisma, type AccessLevel, type AccessScope, type AccessState } from "@sellly/database";

const VIEW_LOG_INTERVAL_MS = 10 * 60 * 1000;

/**
 * Gate for rendering a store's protected data. Returns the access state, and
 * when access is allowed records a "support.viewed" entry in the store's
 * audit history (at most once per section every 10 minutes, so a refresh
 * doesn't flood the log the merchant reads).
 */
export async function gateView(staffUserId: string, storeId: string, scope: AccessScope, section: string): Promise<AccessState> {
  const state = await getStaffAccessState(staffUserId, storeId, scope, "view");
  if (state.allowed) {
    const recent = await prisma.auditLog.findFirst({
      where: {
        storeId,
        userId: staffUserId,
        action: "support.viewed",
        createdAt: { gt: new Date(Date.now() - VIEW_LOG_INTERVAL_MS) },
        metadata: { path: ["section"], equals: section },
      },
      select: { id: true },
    });
    if (!recent) {
      await prisma.auditLog.create({
        data: { storeId, userId: staffUserId, action: "support.viewed", entity: "access_request", entityId: state.grant.id, metadata: { scope, section } },
      });
    }
  }
  return state;
}

export function accessStateMessage(state: AccessState, scope: AccessScope, level: AccessLevel) {
  if (state.allowed) return `Approved until ${state.grant.expiresAt?.toLocaleString("en-IN")}`;
  const what = `${level === "view" ? "view" : "change"} ${ACCESS_SCOPES[scope].label.toLowerCase()}`;
  switch (state.reason) {
    case "PENDING":
      return `Waiting for the store owner to approve your request to ${what}.`;
    case "EXPIRED":
      return `Your approval to ${what} has expired. Request access again if you still need it.`;
    case "REVOKED":
      return `The store owner revoked your access to ${what}.`;
    case "REJECTED":
      return `The store owner didn't approve access to ${what}.`;
    case "CANCELLED":
      return `You withdrew your request to ${what}.`;
    default:
      return `You need the store owner's approval to ${what}.`;
  }
}
