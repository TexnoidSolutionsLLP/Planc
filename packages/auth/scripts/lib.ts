import { createClient, type SupabaseClient, type User as AuthUser } from "@supabase/supabase-js";

// pnpm --filter runs scripts from the package folder; pick up the repo's .env if there is one.
try {
  process.loadEnvFile("../../.env");
} catch {}

/**
 * Operator scripts run from a trusted terminal with the service-role key,
 * which bypasses every Supabase access rule. Never put that key in an app's
 * browser code or a committed file.
 */
export function adminClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (and DATABASE_URL) before running this script.");
    process.exit(1);
  }
  return createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function findAuthUserByEmail(supabase: SupabaseClient, email: string): Promise<AuthUser | null> {
  const target = email.toLowerCase();
  for (let page = 1; page < 1000; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === target);
    if (found) return found;
    if (data.users.length < 1000) return null;
  }
  return null;
}

export function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return undefined;
  const v = process.argv[i + 1];
  return v && !v.startsWith("--") ? v : "";
}

export function flag(name: string) {
  return process.argv.includes(`--${name}`);
}
