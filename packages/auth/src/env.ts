/**
 * Supabase settings, read on the server only. The URL and publishable key are
 * not secret (Supabase designs them to be public), but the apps never need
 * them in the browser — every auth call runs in a server action or route — so
 * the plain names are preferred. The NEXT_PUBLIC_ names are accepted because
 * Vercel's Supabase integration sets those.
 *
 * SUPABASE_PUBLISHABLE_KEY (sb_publishable_...) replaces the legacy anon key,
 * which Supabase retires in 2027. SUPABASE_ANON_KEY is still read as a
 * fallback so a deployment keeps working until its variables are switched.
 */
export function supabaseUrl() {
  return process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
}

export function supabasePublishableKey() {
  return (
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    ""
  );
}

export function isSupabaseAuthConfigured() {
  return Boolean(supabaseUrl() && supabasePublishableKey());
}

export function requireSupabaseEnv() {
  const url = supabaseUrl();
  const key = supabasePublishableKey();
  if (!url || !key) {
    throw new Error("Supabase Auth is not configured: set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY");
  }
  return { url, key };
}

/**
 * Each app keeps its own session cookie, so signing in to the merchant
 * dashboard never signs you in to the platform admin app (or out of it) —
 * even on localhost, where cookies are shared across ports.
 */
export type AuthApp = "web" | "admin";

export const AUTH_COOKIE_NAME: Record<AuthApp, string> = {
  web: "sellly-web-auth",
  admin: "sellly-admin-auth",
};
