import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma, type User } from "@sellly/database";
import { AUTH_COOKIE_NAME, requireSupabaseEnv, type AuthApp } from "./env";

export { isSupabaseAuthConfigured, AUTH_COOKIE_NAME } from "./env";
export type { AuthApp } from "./env";

/**
 * Supabase Auth holds credentials and sessions; our `users` table holds the
 * app profile, store memberships and the platform role. Roles are only ever
 * read from our table — never from Supabase user_metadata, which the user
 * can edit themselves.
 */
export function createSupabaseServerClient(app: AuthApp) {
  // Read cookies first: it marks the route as per-request, so Next never tries
  // to prerender a signed-in page at build time.
  const cookieStore = cookies();
  const { url, key } = requireSupabaseEnv();
  return createServerClient(url, key, {
    cookieOptions: { name: AUTH_COOKIE_NAME[app] },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a server component, where cookies are read-only. The
          // middleware refreshes the session cookie on every request, so this is safe to skip.
        }
      },
    },
  });
}

const LAST_ACTIVE_WRITE_INTERVAL_MS = 15 * 60 * 1000;

/**
 * The signed-in user's app profile, or null. Validates the session with
 * Supabase (getUser, not getSession), then finds the linked profile.
 *
 * Linking an existing profile by email happens only for merchant accounts
 * whose email Supabase has confirmed. Staff profiles are linked exclusively by
 * the staff-setup script, so registering with a staff member's email can
 * never yield staff access. The admin app never creates profiles.
 */
export async function getCurrentUser(app: AuthApp): Promise<User | null> {
  const supabase = createSupabaseServerClient(app);
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser?.email) return null;

  let user = await prisma.user.findUnique({ where: { authId: authUser.id } });

  if (!user) {
    const email = authUser.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      if (existing.authId || existing.platformRole !== "MERCHANT" || !authUser.email_confirmed_at) return null;
      user = await prisma.user.update({ where: { id: existing.id }, data: { authId: authUser.id } });
    } else {
      if (app !== "web") return null;
      const meta = (authUser.user_metadata ?? {}) as { name?: unknown; phone?: unknown };
      try {
        user = await prisma.user.create({
          data: {
            authId: authUser.id,
            email,
            name: typeof meta.name === "string" ? meta.name.slice(0, 120) : null,
            phone: typeof meta.phone === "string" ? meta.phone.slice(0, 20) : null,
            emailVerified: authUser.email_confirmed_at ? new Date(authUser.email_confirmed_at) : null,
            // platformRole is deliberately not set: public sign-up always yields MERCHANT.
          },
        });
      } catch (err) {
        // A first page load fires several server requests at once; if another
        // one created the profile first, use that row.
        if ((err as { code?: string }).code !== "P2002") throw err;
        user = await prisma.user.findUnique({ where: { authId: authUser.id } });
        if (!user) return null;
      }
    }
  }

  if (!user.lastActiveAt || Date.now() - user.lastActiveAt.getTime() > LAST_ACTIVE_WRITE_INTERVAL_MS) {
    user = await prisma.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } });
  }
  return user;
}

export type AuthResult = { ok: true; needsEmailConfirmation?: boolean; authUserId?: string } | { ok: false; error: string };

export async function signInWithPassword(app: AuthApp, email: string, password: string): Promise<AuthResult> {
  const supabase = createSupabaseServerClient(app);
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  if (error) {
    if (error.code === "email_not_confirmed") return { ok: false, error: "Confirm your email first — check your inbox for the link." };
    return { ok: false, error: "Invalid email or password" };
  }
  return { ok: true, authUserId: data.user.id };
}

export async function signUpMerchant(input: {
  email: string;
  password: string;
  name: string;
  phone?: string;
  emailRedirectTo: string;
}): Promise<AuthResult> {
  const supabase = createSupabaseServerClient("web");
  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim().toLowerCase(),
    password: input.password,
    options: {
      emailRedirectTo: input.emailRedirectTo,
      // Display data only. Never put roles or permissions in user_metadata.
      data: { name: input.name, ...(input.phone ? { phone: input.phone } : {}) },
    },
  });
  if (error) {
    if (error.code === "weak_password") return { ok: false, error: error.message };
    if (error.code === "user_already_exists") return { ok: false, error: "An account with this email already exists" };
    return { ok: false, error: "Could not create your account. Try again." };
  }
  return { ok: true, needsEmailConfirmation: !data.session };
}

export async function signOut(app: AuthApp) {
  const supabase = createSupabaseServerClient(app);
  await supabase.auth.signOut();
}

export async function sendPasswordReset(app: AuthApp, email: string, redirectTo: string) {
  const supabase = createSupabaseServerClient(app);
  // The result is ignored on purpose: the UI says the same thing whether or
  // not the account exists, so this can't be used to discover accounts.
  await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo });
}

export async function updatePassword(app: AuthApp, password: string): Promise<AuthResult> {
  const supabase = createSupabaseServerClient(app);
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, error: error.code === "weak_password" || error.code === "same_password" ? error.message : "Could not update your password. Request a new link." };
  return { ok: true };
}

/**
 * Completes an email link (sign-up confirmation, password recovery). Handles
 * both the PKCE `code` flow and the `token_hash` flow, depending on how the
 * Supabase email template is written.
 */
export async function completeEmailLink(app: AuthApp, params: URLSearchParams): Promise<boolean> {
  const supabase = createSupabaseServerClient(app);
  const code = params.get("code");
  if (code) return !(await supabase.auth.exchangeCodeForSession(code)).error;

  const tokenHash = params.get("token_hash");
  const type = params.get("type");
  if (tokenHash && (type === "signup" || type === "email" || type === "recovery" || type === "invite" || type === "email_change")) {
    return !(await supabase.auth.verifyOtp({ token_hash: tokenHash, type })).error;
  }
  return false;
}

/** Only same-site paths, so an email link can't be turned into an open redirect. */
export function safeRedirectPath(next: string | null | undefined, fallback = "/") {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}

/**
 * Resolves the store a request is acting on and asserts the signed-in user
 * is a member of it. Every dashboard route MUST call this before touching
 * store-scoped data — it is the single tenant-isolation checkpoint.
 */
export async function requireStoreAccess(userId: string, storeSlug: string) {
  const store = await prisma.store.findUnique({ where: { slug: storeSlug } });
  if (!store) return null;

  const membership = await prisma.storeMember.findUnique({
    where: { storeId_userId: { storeId: store.id, userId } },
  });
  if (!membership) return null;

  return { store, membership };
}
