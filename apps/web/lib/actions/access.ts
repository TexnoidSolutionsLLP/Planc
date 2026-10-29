"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AccessError, decideAccessRequest, prisma, revokeAccess } from "@sellly/database";
import { requireStoreOwner } from "@/lib/session";

/**
 * Only the store's OWNER reaches these (requireStoreOwner), and the request
 * must belong to this store. decideAccessRequest/revokeAccess re-check
 * ownership, and the database trigger checks it a third time.
 */
async function loadRequest(storeSlug: string, requestId: string) {
  const ctx = await requireStoreOwner(storeSlug);
  const req = await prisma.accessRequest.findFirst({ where: { id: requestId, storeId: ctx.store.id } });
  if (!req) redirect(`/${storeSlug}/access?error=NOT_FOUND`);
  return { ...ctx, req };
}

function done(storeSlug: string, result: string): never {
  revalidatePath(`/${storeSlug}/access`);
  redirect(`/${storeSlug}/access?${result}`);
}

export async function approveAccessAction(storeSlug: string, requestId: string, formData: FormData) {
  const { userId } = await loadRequest(storeSlug, requestId);
  const grantView = formData.get("grantView") === "on";
  const grantModify = formData.get("grantModify") === "on";
  // Letting staff change data is the riskier grant, so it needs an explicit second confirmation.
  if (grantModify && formData.get("confirmModify") !== "on") done(storeSlug, "error=CONFIRM_MODIFY");

  try {
    await decideAccessRequest({
      requestId,
      ownerUserId: userId,
      approve: true,
      grantView,
      grantModify,
      note: String(formData.get("note") ?? ""),
    });
  } catch (err) {
    if (err instanceof AccessError) done(storeSlug, `error=${err.code}`);
    throw err;
  }
  done(storeSlug, "done=approved");
}

export async function rejectAccessAction(storeSlug: string, requestId: string, formData: FormData) {
  const { userId } = await loadRequest(storeSlug, requestId);
  try {
    await decideAccessRequest({ requestId, ownerUserId: userId, approve: false, note: String(formData.get("note") ?? "") });
  } catch (err) {
    if (err instanceof AccessError) done(storeSlug, `error=${err.code}`);
    throw err;
  }
  done(storeSlug, "done=rejected");
}

export async function revokeAccessAction(storeSlug: string, requestId: string) {
  const { userId } = await loadRequest(storeSlug, requestId);
  try {
    await revokeAccess({ requestId, actorUserId: userId });
  } catch (err) {
    if (err instanceof AccessError) done(storeSlug, `error=${err.code}`);
    throw err;
  }
  done(storeSlug, "done=revoked");
}
