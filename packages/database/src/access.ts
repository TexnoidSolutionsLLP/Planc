import type { AccessRequest, AccessScope, Prisma } from "@prisma/client";
import { prisma } from "./index";

/**
 * Sellly staff have no standing access to a merchant's protected data. They
 * request access to one store, one scope and view and/or modify; the store's
 * OWNER approves or rejects it, and every approval expires. These functions
 * are the only way the apps create or change requests, and every protected
 * read or write in the admin app goes through `assertStaffAccess`.
 *
 * The same rules are enforced again by CHECK constraints and a trigger on
 * `access_requests` (see the staff_access_and_supabase migration).
 */

export type AccessLevel = "view" | "modify";

export const ACCESS_SCOPES: Record<
  AccessScope,
  { label: string; view?: string; modify?: string }
> = {
  STORE: {
    label: "Store details",
    view: "See the store's address and contact details, sales totals, payment setup and the store's activity log",
    modify: "Suspend or reactivate the store",
  },
  ORDERS: {
    label: "Orders",
    view: "See orders, including customer names, phone numbers and shipping addresses",
    modify: "Change order statuses",
  },
  CUSTOMERS: {
    label: "Customers",
    view: "See the customer list with contact details and order history",
  },
  PRODUCTS: {
    label: "Products",
    view: "See products, inventory and recorded costs",
  },
  BILLING: {
    label: "Subscription plan",
    modify: "Change the store's Sellly subscription plan",
  },
  ACCOUNT: {
    label: "Owner account",
    modify: "Suspend or reactivate the store owner's Sellly account",
  },
};

export const ACCESS_DURATIONS_HOURS = [1, 4, 24, 72, 168] as const;
export const MAX_ACCESS_DURATION_HOURS = 720;

export function scopeSupports(scope: AccessScope, level: AccessLevel) {
  return Boolean(ACCESS_SCOPES[scope]?.[level]);
}

export class AccessError extends Error {
  constructor(
    public code:
      | "NOT_STAFF"
      | "NOT_OWNER"
      | "SELF_DECISION"
      | "NOT_FOUND"
      | "INVALID"
      | "NOT_PENDING"
      | "NOT_ACTIVE"
      | "DUPLICATE"
      | "DENIED",
    message: string
  ) {
    super(message);
    this.name = "AccessError";
  }
}

/** Approved and not yet expired. Pending, rejected, revoked, cancelled and expired requests grant nothing. */
export function isGrantActive(
  req: Pick<AccessRequest, "status" | "expiresAt">,
  now: Date = new Date()
) {
  return req.status === "APPROVED" && !!req.expiresAt && req.expiresAt.getTime() > now.getTime();
}

export type DisplayStatus = "PENDING" | "ACTIVE" | "EXPIRED" | "REJECTED" | "REVOKED" | "CANCELLED";

export function displayStatus(req: Pick<AccessRequest, "status" | "expiresAt">, now: Date = new Date()): DisplayStatus {
  if (req.status === "APPROVED") return isGrantActive(req, now) ? "ACTIVE" : "EXPIRED";
  return req.status;
}

function grantsLevel(req: Pick<AccessRequest, "grantedView" | "grantedModify">, level: AccessLevel) {
  return level === "view" ? req.grantedView : req.grantedModify;
}

async function loadActiveStaff(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.platformRole !== "PLATFORM_ADMIN" || user.status !== "ACTIVE") {
    throw new AccessError("NOT_STAFF", "Only active Sellly staff can do this");
  }
  return user;
}

/** True only for a merchant (never staff) who is an OWNER of the store and whose account is active. */
export async function isStoreOwner(userId: string, storeId: string) {
  const membership = await prisma.storeMember.findUnique({
    where: { storeId_userId: { storeId, userId } },
    include: { user: true },
  });
  return (
    !!membership &&
    membership.role === "OWNER" &&
    membership.user.platformRole === "MERCHANT" &&
    membership.user.status === "ACTIVE"
  );
}

async function audit(
  tx: Prisma.TransactionClient,
  input: { storeId: string; userId: string; action: string; requestId: string; metadata?: Record<string, unknown> }
) {
  await tx.auditLog.create({
    data: {
      storeId: input.storeId,
      userId: input.userId,
      action: input.action,
      entity: "access_request",
      entityId: input.requestId,
      metadata: input.metadata as any,
    },
  });
}

export async function requestAccess(input: {
  staffUserId: string;
  storeId: string;
  scope: AccessScope;
  view: boolean;
  modify: boolean;
  reason: string;
  durationHours: number;
}) {
  await loadActiveStaff(input.staffUserId);

  if (!ACCESS_SCOPES[input.scope]) throw new AccessError("INVALID", "Unknown access scope");
  if (!input.view && !input.modify) throw new AccessError("INVALID", "Choose view access, modify access, or both");
  if (input.view && !scopeSupports(input.scope, "view")) {
    throw new AccessError("INVALID", `${ACCESS_SCOPES[input.scope].label} has no view-only access`);
  }
  if (input.modify && !scopeSupports(input.scope, "modify")) {
    throw new AccessError("INVALID", `${ACCESS_SCOPES[input.scope].label} can't be modified by staff`);
  }
  const reason = input.reason.trim();
  if (reason.length < 10 || reason.length > 1000) {
    throw new AccessError("INVALID", "Explain why you need access (10 to 1000 characters)");
  }
  if (!Number.isInteger(input.durationHours) || input.durationHours < 1 || input.durationHours > MAX_ACCESS_DURATION_HOURS) {
    throw new AccessError("INVALID", `Duration must be between 1 and ${MAX_ACCESS_DURATION_HOURS} hours`);
  }

  const store = await prisma.store.findUnique({ where: { id: input.storeId } });
  if (!store) throw new AccessError("NOT_FOUND", "Store not found");

  const duplicate = await prisma.accessRequest.findFirst({
    where: { storeId: input.storeId, requestedById: input.staffUserId, scope: input.scope, status: "PENDING" },
  });
  if (duplicate) throw new AccessError("DUPLICATE", "You already have a pending request for this area of this store");

  return prisma.$transaction(async (tx) => {
    const req = await tx.accessRequest.create({
      data: {
        storeId: input.storeId,
        requestedById: input.staffUserId,
        scope: input.scope,
        requestedView: input.view,
        requestedModify: input.modify,
        reason,
        durationHours: input.durationHours,
      },
    });
    await audit(tx, {
      storeId: input.storeId,
      userId: input.staffUserId,
      action: "access.requested",
      requestId: req.id,
      metadata: { scope: input.scope, view: input.view, modify: input.modify, durationHours: input.durationHours, reason },
    });
    return req;
  });
}

export async function decideAccessRequest(input: {
  requestId: string;
  ownerUserId: string;
  approve: boolean;
  grantView?: boolean;
  grantModify?: boolean;
  note?: string;
}) {
  const req = await prisma.accessRequest.findUnique({ where: { id: input.requestId } });
  if (!req) throw new AccessError("NOT_FOUND", "Request not found");
  if (req.status !== "PENDING") throw new AccessError("NOT_PENDING", "This request has already been decided");
  if (req.requestedById === input.ownerUserId) {
    throw new AccessError("SELF_DECISION", "You can't decide your own access request");
  }
  if (!(await isStoreOwner(input.ownerUserId, req.storeId))) {
    throw new AccessError("NOT_OWNER", "Only the store owner can approve or reject access requests");
  }

  const grantView = input.approve && !!input.grantView && req.requestedView;
  const grantModify = input.approve && !!input.grantModify && req.requestedModify;
  if (input.approve && !grantView && !grantModify) {
    throw new AccessError("INVALID", "Approve at least one of the requested permissions, or reject the request");
  }
  const note = input.note?.trim().slice(0, 1000) || null;

  return prisma.$transaction(async (tx) => {
    // updateMany with status: PENDING closes the race where two decisions land at once.
    const result = await tx.accessRequest.updateMany({
      where: { id: req.id, status: "PENDING" },
      data: {
        status: input.approve ? "APPROVED" : "REJECTED",
        grantedView: grantView,
        grantedModify: grantModify,
        decidedById: input.ownerUserId,
        decidedAt: new Date(), // overwritten by the database clock in the trigger
        expiresAt: input.approve ? new Date(Date.now() + req.durationHours * 3600_000) : null,
        decisionNote: note,
      },
    });
    if (result.count !== 1) throw new AccessError("NOT_PENDING", "This request has already been decided");
    const updated = await tx.accessRequest.findUniqueOrThrow({ where: { id: req.id } });
    await audit(tx, {
      storeId: req.storeId,
      userId: input.ownerUserId,
      action: input.approve ? "access.approved" : "access.rejected",
      requestId: req.id,
      metadata: {
        scope: req.scope,
        grantedView: updated.grantedView,
        grantedModify: updated.grantedModify,
        expiresAt: updated.expiresAt?.toISOString() ?? null,
        note,
      },
    });
    return updated;
  });
}

/** The store owner can revoke any approved grant on their store; staff can give up their own grant early. */
export async function revokeAccess(input: { requestId: string; actorUserId: string }) {
  const req = await prisma.accessRequest.findUnique({ where: { id: input.requestId } });
  if (!req) throw new AccessError("NOT_FOUND", "Request not found");
  if (req.status !== "APPROVED") throw new AccessError("NOT_ACTIVE", "Only approved access can be revoked");

  const isRequester = req.requestedById === input.actorUserId;
  if (!isRequester && !(await isStoreOwner(input.actorUserId, req.storeId))) {
    throw new AccessError("NOT_OWNER", "Only the store owner can revoke this access");
  }

  return prisma.$transaction(async (tx) => {
    const result = await tx.accessRequest.updateMany({
      where: { id: req.id, status: "APPROVED" },
      data: { status: "REVOKED", revokedById: input.actorUserId, revokedAt: new Date() },
    });
    if (result.count !== 1) throw new AccessError("NOT_ACTIVE", "This access is no longer active");
    await audit(tx, {
      storeId: req.storeId,
      userId: input.actorUserId,
      action: isRequester ? "access.relinquished" : "access.revoked",
      requestId: req.id,
      metadata: { scope: req.scope, wasExpired: !isGrantActive(req) },
    });
    return tx.accessRequest.findUniqueOrThrow({ where: { id: req.id } });
  });
}

export async function cancelAccessRequest(input: { requestId: string; staffUserId: string }) {
  const req = await prisma.accessRequest.findUnique({ where: { id: input.requestId } });
  if (!req || req.requestedById !== input.staffUserId) throw new AccessError("NOT_FOUND", "Request not found");
  if (req.status !== "PENDING") throw new AccessError("NOT_PENDING", "Only pending requests can be cancelled");

  return prisma.$transaction(async (tx) => {
    const result = await tx.accessRequest.updateMany({
      where: { id: req.id, status: "PENDING" },
      data: { status: "CANCELLED", revokedById: input.staffUserId, revokedAt: new Date() },
    });
    if (result.count !== 1) throw new AccessError("NOT_PENDING", "Only pending requests can be cancelled");
    await audit(tx, {
      storeId: req.storeId,
      userId: input.staffUserId,
      action: "access.cancelled",
      requestId: req.id,
      metadata: { scope: req.scope },
    });
  });
}

/** The active grant giving this staff member `level` on `scope` for the store, or null. */
export async function findActiveGrant(staffUserId: string, storeId: string, scope: AccessScope, level: AccessLevel) {
  const now = new Date();
  return prisma.accessRequest.findFirst({
    where: {
      storeId,
      requestedById: staffUserId,
      scope,
      status: "APPROVED",
      expiresAt: { gt: now },
      ...(level === "view" ? { grantedView: true } : { grantedModify: true }),
    },
    orderBy: { expiresAt: "desc" },
  });
}

export type AccessState = { allowed: true; grant: AccessRequest } | { allowed: false; reason: DisplayStatus | "NONE"; latest: AccessRequest | null };

/**
 * Explains why access is or isn't available, so the admin UI can say
 * "pending", "expired", "revoked" etc. instead of a bare "denied".
 */
export async function getStaffAccessState(
  staffUserId: string,
  storeId: string,
  scope: AccessScope,
  level: AccessLevel
): Promise<AccessState> {
  const grant = await findActiveGrant(staffUserId, storeId, scope, level);
  if (grant) return { allowed: true, grant };

  const latest = await prisma.accessRequest.findFirst({
    where: {
      storeId,
      requestedById: staffUserId,
      scope,
      ...(level === "view" ? { requestedView: true } : { requestedModify: true }),
    },
    orderBy: { createdAt: "desc" },
  });
  if (!latest) return { allowed: false, reason: "NONE", latest: null };
  // An approval that granted only the other level reads as "rejected" for this level.
  const status = displayStatus(latest);
  if (status === "ACTIVE" && !grantsLevel(latest, level)) return { allowed: false, reason: "REJECTED", latest };
  return { allowed: false, reason: status, latest };
}

/**
 * Server-side gate for every protected read or write in the admin app. Throws
 * unless the caller is active staff holding an unexpired grant for exactly
 * this store, scope and level.
 */
export async function assertStaffAccess(staffUserId: string, storeId: string, scope: AccessScope, level: AccessLevel) {
  await loadActiveStaff(staffUserId);
  const grant = await findActiveGrant(staffUserId, storeId, scope, level);
  if (!grant) {
    throw new AccessError("DENIED", `No active ${level} access to ${ACCESS_SCOPES[scope].label.toLowerCase()} for this store`);
  }
  return grant;
}

/** Store ids where this staff member currently holds `level` on `scope`. */
export async function storesWithActiveGrant(staffUserId: string, scope: AccessScope, level: AccessLevel) {
  const grants = await prisma.accessRequest.findMany({
    where: {
      requestedById: staffUserId,
      scope,
      status: "APPROVED",
      expiresAt: { gt: new Date() },
      ...(level === "view" ? { grantedView: true } : { grantedModify: true }),
    },
    select: { storeId: true },
  });
  return [...new Set(grants.map((g) => g.storeId))];
}
