"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  AccessError,
  assertStaffAccess,
  cancelAccessRequest,
  prisma,
  requestAccess,
  revokeAccess,
  writeAuditLog,
  type AccessScope,
  type OrderStatus,
  type SubscriptionPlan,
} from "@sellly/database";
import { signInWithPassword, signOut } from "@sellly/auth";
import { checkRateLimit } from "@sellly/rate-limit";
import { requireAdmin } from "@/lib/require-admin";
import { PLANS } from "@/lib/plans";

export type FormState = { error?: string } | undefined;

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const ip = headers().get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(`admin-login:${ip}:${email.toLowerCase()}`, 5, 15 * 60 * 1000).allowed) {
    return { error: "Too many attempts. Try again in a few minutes." };
  }

  const result = await signInWithPassword("admin", email, password);
  if (!result.ok) return { error: result.error };

  // A valid Supabase login isn't enough: the linked profile must be active staff.
  const user = result.authUserId ? await prisma.user.findUnique({ where: { authId: result.authUserId } }) : null;
  if (!user || user.platformRole !== "PLATFORM_ADMIN" || user.status !== "ACTIVE") {
    await signOut("admin");
    return { error: "This account doesn't have Sellly staff access." };
  }
  redirect("/");
}

export async function signOutAction() {
  await signOut("admin");
  redirect("/login");
}

function back(path: string, query: string): never {
  revalidatePath(path);
  redirect(`${path}${path.includes("?") ? "&" : "?"}${query}`);
}

async function guard(storeId: string, scope: AccessScope, returnTo: string) {
  const staff = await requireAdmin();
  try {
    const grant = await assertStaffAccess(staff.id, storeId, scope, "modify");
    return { staff, grant };
  } catch (err) {
    if (err instanceof AccessError) back(returnTo, `error=${encodeURIComponent(err.message)}`);
    throw err;
  }
}

/** Consequential actions also need the operator to retype a value (store slug / owner email). */
function requireTypedConfirmation(formData: FormData, expected: string, returnTo: string) {
  if (String(formData.get("confirmText") ?? "").trim().toLowerCase() !== expected.toLowerCase()) {
    back(returnTo, `error=${encodeURIComponent(`Type "${expected}" to confirm.`)}`);
  }
}

// ─── Access requests ────────────────────────────────────────────────────────

export async function requestAccessAction(storeId: string, formData: FormData) {
  const staff = await requireAdmin();
  const returnTo = `/stores/${storeId}`;
  try {
    await requestAccess({
      staffUserId: staff.id,
      storeId,
      scope: String(formData.get("scope")) as AccessScope,
      view: formData.get("view") === "on",
      modify: formData.get("modify") === "on",
      reason: String(formData.get("reason") ?? ""),
      durationHours: Number(formData.get("durationHours")),
    });
  } catch (err) {
    if (err instanceof AccessError) back(returnTo, `error=${encodeURIComponent(err.message)}`);
    throw err;
  }
  back(returnTo, "done=requested");
}

export async function cancelRequestAction(requestId: string, returnTo: string) {
  const staff = await requireAdmin();
  try {
    await cancelAccessRequest({ requestId, staffUserId: staff.id });
  } catch (err) {
    if (err instanceof AccessError) back(returnTo, `error=${encodeURIComponent(err.message)}`);
    throw err;
  }
  back(returnTo, "done=cancelled");
}

/** Staff can end their own grant early; only the owner can revoke someone else's. */
export async function relinquishAccessAction(requestId: string, returnTo: string) {
  const staff = await requireAdmin();
  const req = await prisma.accessRequest.findUnique({ where: { id: requestId } });
  if (!req || req.requestedById !== staff.id) back(returnTo, "error=Request%20not%20found");
  try {
    await revokeAccess({ requestId, actorUserId: staff.id });
  } catch (err) {
    if (err instanceof AccessError) back(returnTo, `error=${encodeURIComponent(err.message)}`);
    throw err;
  }
  back(returnTo, "done=relinquished");
}

// ─── Store controls (STORE / BILLING / ACCOUNT modify) ─────────────────────

export async function suspendStoreAction(storeId: string, formData: FormData) {
  const returnTo = `/stores/${storeId}`;
  const { staff, grant } = await guard(storeId, "STORE", returnTo);
  const store = await prisma.store.findUniqueOrThrow({ where: { id: storeId } });
  requireTypedConfirmation(formData, store.slug, returnTo);
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 500);
  if (reason.length < 5) back(returnTo, "error=Give%20a%20reason%20the%20merchant%20will%20see.");
  if (store.status === "SUSPENDED") back(returnTo, "error=The%20store%20is%20already%20suspended.");

  await prisma.store.update({ where: { id: storeId }, data: { status: "SUSPENDED", suspendedAt: new Date(), suspendedReason: reason } });
  await writeAuditLog({ storeId, userId: staff.id, action: "support.store_suspended", entity: "store", entityId: storeId, metadata: { reason, from: store.status, to: "SUSPENDED", grantId: grant.id } });
  back(returnTo, "done=suspended");
}

export async function reactivateStoreAction(storeId: string, formData: FormData) {
  const returnTo = `/stores/${storeId}`;
  const { staff, grant } = await guard(storeId, "STORE", returnTo);
  const store = await prisma.store.findUniqueOrThrow({ where: { id: storeId } });
  requireTypedConfirmation(formData, store.slug, returnTo);
  if (store.status !== "SUSPENDED") back(returnTo, "error=The%20store%20isn't%20suspended.");

  // Back to where it was: live if it had been published, otherwise draft.
  const to = store.publishedAt ? "PUBLISHED" : "DRAFT";
  await prisma.store.update({ where: { id: storeId }, data: { status: to, suspendedAt: null, suspendedReason: null } });
  await writeAuditLog({ storeId, userId: staff.id, action: "support.store_reactivated", entity: "store", entityId: storeId, metadata: { from: "SUSPENDED", to, grantId: grant.id } });
  back(returnTo, "done=reactivated");
}

export async function changePlanAction(storeId: string, formData: FormData) {
  const returnTo = `/stores/${storeId}`;
  const { staff, grant } = await guard(storeId, "BILLING", returnTo);
  const plan = String(formData.get("plan")) as SubscriptionPlan;
  if (!PLANS.includes(plan as (typeof PLANS)[number])) back(returnTo, "error=Unknown%20plan");
  if (formData.get("confirm") !== "on") back(returnTo, "error=Tick%20the%20confirmation%20box%20to%20change%20the%20plan.");

  const current = await prisma.subscription.findUnique({ where: { storeId } });
  const from = current?.plan ?? "FREE";
  if (from === plan) back(returnTo, "error=The%20store%20is%20already%20on%20that%20plan.");
  await prisma.subscription.upsert({ where: { storeId }, update: { plan }, create: { storeId, plan } });
  await writeAuditLog({ storeId, userId: staff.id, action: "support.plan_changed", entity: "subscription", entityId: storeId, metadata: { from, to: plan, grantId: grant.id } });
  back(returnTo, "done=plan");
}

export async function setOwnerAccountStatusAction(storeId: string, ownerUserId: string, suspend: boolean, formData: FormData) {
  const returnTo = `/stores/${storeId}`;
  const { staff, grant } = await guard(storeId, "ACCOUNT", returnTo);
  // The grant is for this store's owner only — never any other account.
  const membership = await prisma.storeMember.findUnique({ where: { storeId_userId: { storeId, userId: ownerUserId } }, include: { user: true } });
  if (!membership || membership.role !== "OWNER" || membership.user.platformRole !== "MERCHANT") back(returnTo, "error=That%20user%20isn't%20this%20store's%20owner.");
  requireTypedConfirmation(formData, membership.user.email, returnTo);

  await prisma.user.update({
    where: { id: ownerUserId },
    data: suspend ? { status: "SUSPENDED", suspendedAt: new Date() } : { status: "ACTIVE", suspendedAt: null },
  });
  await writeAuditLog({
    storeId,
    userId: staff.id,
    action: suspend ? "support.account_suspended" : "support.account_reactivated",
    entity: "user",
    entityId: ownerUserId,
    metadata: { from: membership.user.status, to: suspend ? "SUSPENDED" : "ACTIVE", grantId: grant.id },
  });
  back(returnTo, suspend ? "done=account_suspended" : "done=account_reactivated");
}

// ─── Orders (ORDERS modify) ────────────────────────────────────────────────

const STAFF_SETTABLE_STATUSES: OrderStatus[] = ["CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];

export async function updateOrderStatusAction(storeId: string, orderId: string, formData: FormData) {
  const returnTo = `/stores/${storeId}/orders/${orderId}`;
  const { staff, grant } = await guard(storeId, "ORDERS", returnTo);
  const status = String(formData.get("status")) as OrderStatus;
  if (!STAFF_SETTABLE_STATUSES.includes(status)) back(returnTo, "error=Pick%20a%20status");
  if (formData.get("confirm") !== "on") back(returnTo, "error=Tick%20the%20confirmation%20box.");

  const order = await prisma.order.findFirst({ where: { id: orderId, storeId } });
  if (!order) back(returnTo, "error=Order%20not%20found");
  if (order.status === status) back(returnTo, "error=The%20order%20already%20has%20that%20status.");

  await prisma.order.update({
    where: { id: orderId },
    data: { status, events: { create: { status, message: "Updated by Sellly support" } } },
  });
  await writeAuditLog({ storeId, userId: staff.id, action: "support.order_status_changed", entity: "order", entityId: orderId, metadata: { from: order.status, to: status, orderNumber: order.orderNumber, grantId: grant.id } });
  back(returnTo, "done=status");
}
