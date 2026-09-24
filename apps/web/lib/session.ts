import { redirect, notFound } from "next/navigation";
import { auth, requireStoreAccess } from "@sellly/auth";

export async function requireUser() {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) redirect("/login");
  return { userId, email: session!.user!.email as string, name: session!.user!.name };
}

/** Every dashboard page for a tenant route MUST call this — it is the tenant
 * isolation checkpoint that stops one merchant loading another's store. */
export async function requireStore(storeSlug: string) {
  const { userId } = await requireUser();
  const access = await requireStoreAccess(userId, storeSlug);
  if (!access) notFound();
  return { ...access, userId };
}

/**
 * Same tenant check as requireStore, but for route handlers — notFound()
 * from next/navigation is a page-rendering primitive and doesn't produce a
 * sane response from an API route, so this returns null instead of throwing.
 */
export async function requireStoreForApi(storeSlug: string) {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return null;

  const access = await requireStoreAccess(userId, storeSlug);
  if (!access) return null;
  return { ...access, userId };
}
