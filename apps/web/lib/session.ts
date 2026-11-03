import { cache } from "react";
import { redirect, notFound } from "next/navigation";
import { getCurrentUser, requireStoreAccess } from "@sellly/auth";

/**
 * Memoized per request: layouts, pages and server actions all ask who the
 * user is, and without this each call repeats the Supabase round trip and the
 * profile query.
 */
export const getWebUser = cache(() => getCurrentUser("web"));
const getStoreAccess = cache((userId: string, storeSlug: string) => requireStoreAccess(userId, storeSlug));

export async function requireUser() {
  const user = await getWebUser();
  if (!user) redirect("/login");
  if (user.status !== "ACTIVE") redirect("/login?error=suspended");
  // Staff and merchant identities stay separate: staff use the admin app only.
  if (user.platformRole !== "MERCHANT") redirect("/login?error=staff");
  return { userId: user.id, email: user.email, name: user.name, user };
}

/** Every dashboard page for a tenant route MUST call this — it is the tenant
 * isolation checkpoint that stops one merchant loading another's store. */
export async function requireStore(storeSlug: string) {
  const { userId, user } = await requireUser();
  const access = await getStoreAccess(userId, storeSlug);
  if (!access) notFound();
  return { ...access, userId, user };
}

/** Store owners are the only people who can approve Sellly staff access. */
export async function requireStoreOwner(storeSlug: string) {
  const ctx = await requireStore(storeSlug);
  if (ctx.membership.role !== "OWNER" || ctx.user.platformRole !== "MERCHANT") notFound();
  return ctx;
}

/**
 * Same tenant check as requireStore, but for route handlers — notFound()
 * from next/navigation is a page-rendering primitive and doesn't produce a
 * sane response from an API route, so this returns null instead of throwing.
 */
export async function requireStoreForApi(storeSlug: string) {
  const user = await getWebUser();
  if (!user || user.status !== "ACTIVE" || user.platformRole !== "MERCHANT") return null;

  const access = await getStoreAccess(user.id, storeSlug);
  if (!access) return null;
  return { ...access, userId: user.id };
}
