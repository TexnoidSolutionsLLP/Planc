import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, isSupabaseAuthConfigured, requireSupabaseEnv, type AuthApp } from "./env";

/**
 * Runs in each app's middleware (edge runtime — no Prisma here). It refreshes
 * the Supabase session cookie before the page renders, which server
 * components can't do themselves, so a session survives refreshes and
 * long-open tabs. It does not authorize anything: every page, server action
 * and route checks the user and their role on the server.
 */
export async function updateSession(request: NextRequest, app: AuthApp) {
  let response = NextResponse.next({ request });
  if (!isSupabaseAuthConfigured()) return response;

  const { url, key } = requireSupabaseEnv();
  const supabase = createServerClient(url, key, {
    cookieOptions: { name: AUTH_COOKIE_NAME[app] },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // getUser() (not getSession()) asks Supabase to validate the token and
  // refreshes it when needed.
  await supabase.auth.getUser();
  return response;
}
