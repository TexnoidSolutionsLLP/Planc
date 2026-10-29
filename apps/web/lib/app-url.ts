import { headers } from "next/headers";

/**
 * This app's public origin, for links in auth emails. APP_URL wins when set
 * (set it in production); otherwise it's derived from the request. Supabase
 * only sends users to redirect URLs on its allow-list, so a spoofed Host
 * header can't redirect anyone elsewhere.
 */
export function appOrigin() {
  const configured = process.env.APP_URL?.replace(/\/$/, "");
  if (configured) return configured;
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
