import { redirect, notFound } from "next/navigation";
import { getCurrentUser, requireStoreAccess } from "@sellly/auth";

export async function requireUser() {
  const user = await getCurrentUser("web");
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
  const access = await requireStoreAccess(userId, storeSlug);
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
  const user = await getCurrentUser("web");
  if (!user || user.status !== "ACTIVE" || user.platformRole !== "MERCHANT") return null;

  const access = await requireStoreAccess(user.id, storeSlug);
  if (!access) return null;
  return { ...access, userId: user.id };
}
