import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";

/**
 * Runs against a real Postgres with all migrations applied, because half of
 * what it checks is the database trigger. Skipped unless TEST_DATABASE_URL is
 * set — never point it at a database with data you care about.
 */
const TEST_DB = process.env.TEST_DATABASE_URL;

describe.skipIf(!TEST_DB)("staff access requests", () => {
  let db: typeof import("./index");
  const tag = randomUUID().slice(0, 8);
  const ids = { staff: "", staff2: "", owner: "", admin: "", otherOwner: "", staffOwner: "", store: "", otherStore: "" };

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DB;
    db = await import("./index");
    const { prisma } = db;
    const mk = (name: string, role: "MERCHANT" | "PLATFORM_ADMIN" = "MERCHANT") =>
      prisma.user.create({ data: { email: `${name}-${tag}@test.local`, name, platformRole: role } });

    ids.staff = (await mk("staff", "PLATFORM_ADMIN")).id;
    ids.staff2 = (await mk("staff2", "PLATFORM_ADMIN")).id;
    ids.owner = (await mk("owner")).id;
    ids.admin = (await mk("storeadmin")).id;
    ids.otherOwner = (await mk("otherowner")).id;
    ids.staffOwner = (await mk("staffowner", "PLATFORM_ADMIN")).id;

    ids.store = (
      await prisma.store.create({
        data: {
          name: "Test Store",
          slug: `test-${tag}`,
          members: {
            create: [
              { userId: ids.owner, role: "OWNER" },
              { userId: ids.admin, role: "ADMIN" },
              // A staff member who is also listed as an owner must still never be able to approve.
              { userId: ids.staffOwner, role: "OWNER" },
            ],
          },
        },
      })
    ).id;
    ids.otherStore = (
      await prisma.store.create({
        data: { name: "Other", slug: `other-${tag}`, members: { create: { userId: ids.otherOwner, role: "OWNER" } } },
      })
    ).id;
  });

  afterAll(async () => {
    if (!db) return;
    const { prisma } = db;
    await prisma.store.deleteMany({ where: { id: { in: [ids.store, ids.otherStore] } } });
    await prisma.auditLog.deleteMany({ where: { userId: { in: Object.values(ids) } } });
    await prisma.user.deleteMany({ where: { email: { endsWith: `-${tag}@test.local` } } });
    await prisma.$disconnect();
  });

  const baseRequest = () => ({
    staffUserId: ids.staff,
    storeId: ids.store,
    scope: "ORDERS" as const,
    view: true,
    modify: true,
    reason: "Customer reported a missing order, need to check it",
    durationHours: 1,
  });

  it("rejects requests from merchants, and the database refuses them too", async () => {
    await expect(db.requestAccess({ ...baseRequest(), staffUserId: ids.owner })).rejects.toMatchObject({ code: "NOT_STAFF" });
    await expect(
      db.prisma.accessRequest.create({
        data: { storeId: ids.store, requestedById: ids.owner, scope: "ORDERS", requestedView: true, reason: "x".repeat(20), durationHours: 1 },
      })
    ).rejects.toThrow(/only active Sellly staff/);
  });

  it("validates scope levels, reason and duration", async () => {
    await expect(db.requestAccess({ ...baseRequest(), scope: "CUSTOMERS", view: false, modify: true })).rejects.toMatchObject({ code: "INVALID" });
    await expect(db.requestAccess({ ...baseRequest(), scope: "BILLING", view: true, modify: false })).rejects.toMatchObject({ code: "INVALID" });
    await expect(db.requestAccess({ ...baseRequest(), view: false, modify: false })).rejects.toMatchObject({ code: "INVALID" });
    await expect(db.requestAccess({ ...baseRequest(), reason: "short" })).rejects.toMatchObject({ code: "INVALID" });
    await expect(db.requestAccess({ ...baseRequest(), durationHours: 721 })).rejects.toMatchObject({ code: "INVALID" });
  });

  it("a pending request grants nothing", async () => {
    const req = await db.requestAccess(baseRequest());
    expect(req.status).toBe("PENDING");
    await expect(db.assertStaffAccess(ids.staff, ids.store, "ORDERS", "view")).rejects.toMatchObject({ code: "DENIED" });
    const state = await db.getStaffAccessState(ids.staff, ids.store, "ORDERS", "view");
    expect(state).toMatchObject({ allowed: false, reason: "PENDING" });
    await expect(db.requestAccess(baseRequest())).rejects.toMatchObject({ code: "DUPLICATE" });
    await db.cancelAccessRequest({ requestId: req.id, staffUserId: ids.staff });
  });

  it("only the merchant owner can decide — not the requester, other staff, staff listed as owner, store admins or other stores' owners", async () => {
    const req = await db.requestAccess(baseRequest());
    const attempt = (userId: string) => db.decideAccessRequest({ requestId: req.id, ownerUserId: userId, approve: true, grantView: true, grantModify: true });

    await expect(attempt(ids.staff)).rejects.toMatchObject({ code: "SELF_DECISION" });
    await expect(attempt(ids.staff2)).rejects.toMatchObject({ code: "NOT_OWNER" });
    await expect(attempt(ids.staffOwner)).rejects.toMatchObject({ code: "NOT_OWNER" });
    await expect(attempt(ids.admin)).rejects.toMatchObject({ code: "NOT_OWNER" });
    await expect(attempt(ids.otherOwner)).rejects.toMatchObject({ code: "NOT_OWNER" });

    // Bypassing the app code and writing the row directly is blocked by the trigger.
    for (const decider of [ids.staff, ids.staffOwner, ids.admin, ids.otherOwner]) {
      await expect(
        db.prisma.accessRequest.update({
          where: { id: req.id },
          data: { status: "APPROVED", grantedView: true, decidedById: decider, decidedAt: new Date(), expiresAt: new Date(Date.now() + 3600_000) },
        })
      ).rejects.toThrow();
    }
    // Inserting an already-approved row is blocked too.
    await expect(
      db.prisma.accessRequest.create({
        data: {
          storeId: ids.store, requestedById: ids.staff, scope: "STORE", requestedView: true, grantedView: true,
          reason: "x".repeat(20), durationHours: 1, status: "APPROVED", decidedById: ids.owner, decidedAt: new Date(), expiresAt: new Date(Date.now() + 3600_000),
        },
      })
    ).rejects.toThrow(/PENDING/);

    expect((await db.prisma.accessRequest.findUniqueOrThrow({ where: { id: req.id } })).status).toBe("PENDING");
    await db.cancelAccessRequest({ requestId: req.id, staffUserId: ids.staff });
  });

  it("view and modify are granted independently, and only for the approved store", async () => {
    const req = await db.requestAccess(baseRequest());
    const approved = await db.decideAccessRequest({ requestId: req.id, ownerUserId: ids.owner, approve: true, grantView: true, grantModify: false });
    expect(approved).toMatchObject({ status: "APPROVED", grantedView: true, grantedModify: false });

    await expect(db.assertStaffAccess(ids.staff, ids.store, "ORDERS", "view")).resolves.toBeTruthy();
    await expect(db.assertStaffAccess(ids.staff, ids.store, "ORDERS", "modify")).rejects.toMatchObject({ code: "DENIED" });
    expect(await db.getStaffAccessState(ids.staff, ids.store, "ORDERS", "modify")).toMatchObject({ allowed: false, reason: "REJECTED" });
    // Other scope, other store, other staff member: nothing.
    await expect(db.assertStaffAccess(ids.staff, ids.store, "CUSTOMERS", "view")).rejects.toMatchObject({ code: "DENIED" });
    await expect(db.assertStaffAccess(ids.staff, ids.otherStore, "ORDERS", "view")).rejects.toMatchObject({ code: "DENIED" });
    await expect(db.assertStaffAccess(ids.staff2, ids.store, "ORDERS", "view")).rejects.toMatchObject({ code: "DENIED" });
    expect(await db.storesWithActiveGrant(ids.staff, "ORDERS", "view")).toEqual([ids.store]);

    // The database sets the expiry from its own clock: ~1 hour from now.
    const msLeft = approved.expiresAt!.getTime() - Date.now();
    expect(msLeft).toBeGreaterThan(3500_000);
    expect(msLeft).toBeLessThan(3700_000);

    // A decided request can't be edited to widen it.
    await expect(db.prisma.accessRequest.update({ where: { id: req.id }, data: { grantedModify: true } })).rejects.toThrow();
    await expect(db.prisma.accessRequest.update({ where: { id: req.id }, data: { expiresAt: new Date(Date.now() + 1e10) } })).rejects.toThrow();
    await expect(db.prisma.accessRequest.update({ where: { id: req.id }, data: { reason: "Something else entirely" } })).rejects.toThrow();

    await db.revokeAccess({ requestId: req.id, actorUserId: ids.owner });
  });

  it("expired approvals grant nothing", async () => {
    const req = await db.requestAccess({ ...baseRequest(), scope: "CUSTOMERS", modify: false });
    await db.decideAccessRequest({ requestId: req.id, ownerUserId: ids.owner, approve: true, grantView: true });
    await expect(db.assertStaffAccess(ids.staff, ids.store, "CUSTOMERS", "view")).resolves.toBeTruthy();

    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(Date.now() + 2 * 3600_000));
    try {
      await expect(db.assertStaffAccess(ids.staff, ids.store, "CUSTOMERS", "view")).rejects.toMatchObject({ code: "DENIED" });
      expect(await db.getStaffAccessState(ids.staff, ids.store, "CUSTOMERS", "view")).toMatchObject({ allowed: false, reason: "EXPIRED" });
    } finally {
      vi.useRealTimers();
    }
  });

  it("the owner can revoke at any time; unrelated users can't", async () => {
    const req = await db.requestAccess({ ...baseRequest(), scope: "PRODUCTS", modify: false });
    await db.decideAccessRequest({ requestId: req.id, ownerUserId: ids.owner, approve: true, grantView: true });

    await expect(db.revokeAccess({ requestId: req.id, actorUserId: ids.otherOwner })).rejects.toMatchObject({ code: "NOT_OWNER" });
    await expect(db.revokeAccess({ requestId: req.id, actorUserId: ids.staff2 })).rejects.toMatchObject({ code: "NOT_OWNER" });

    await db.revokeAccess({ requestId: req.id, actorUserId: ids.owner });
    await expect(db.assertStaffAccess(ids.staff, ids.store, "PRODUCTS", "view")).rejects.toMatchObject({ code: "DENIED" });
    expect(await db.getStaffAccessState(ids.staff, ids.store, "PRODUCTS", "view")).toMatchObject({ allowed: false, reason: "REVOKED" });
    await expect(db.revokeAccess({ requestId: req.id, actorUserId: ids.owner })).rejects.toMatchObject({ code: "NOT_ACTIVE" });
  });

  it("rejection grants nothing, and suspended staff lose access", async () => {
    const rejected = await db.requestAccess({ ...baseRequest(), scope: "STORE" });
    await db.decideAccessRequest({ requestId: rejected.id, ownerUserId: ids.owner, approve: false, note: "Not now" });
    await expect(db.assertStaffAccess(ids.staff, ids.store, "STORE", "view")).rejects.toMatchObject({ code: "DENIED" });

    const req = await db.requestAccess({ ...baseRequest(), staffUserId: ids.staff2, scope: "STORE", modify: false });
    await db.decideAccessRequest({ requestId: req.id, ownerUserId: ids.owner, approve: true, grantView: true });
    await expect(db.assertStaffAccess(ids.staff2, ids.store, "STORE", "view")).resolves.toBeTruthy();
    await db.prisma.user.update({ where: { id: ids.staff2 }, data: { status: "SUSPENDED" } });
    await expect(db.assertStaffAccess(ids.staff2, ids.store, "STORE", "view")).rejects.toMatchObject({ code: "NOT_STAFF" });
    await db.prisma.user.update({ where: { id: ids.staff2 }, data: { status: "ACTIVE" } });
  });

  it("writes every step to the store's audit history", async () => {
    const actions = (
      await db.prisma.auditLog.findMany({ where: { storeId: ids.store, entity: "access_request" }, select: { action: true } })
    ).map((a) => a.action);
    for (const a of ["access.requested", "access.approved", "access.rejected", "access.revoked", "access.cancelled"]) {
      expect(actions).toContain(a);
    }
  });
});
