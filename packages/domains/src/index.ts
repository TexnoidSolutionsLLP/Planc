/**
 * Store web addresses, decided in one place for every app.
 *
 * - `STOREFRONT_DOMAIN` unset (e.g. while on *.vercel.app): stores are reached
 *   by path — `${STOREFRONT_URL}/<slug>`.
 * - `STOREFRONT_DOMAIN="texnoidstores.com"`: stores are reached by subdomain —
 *   `https://<slug>.texnoidstores.com`. The storefront project needs the
 *   wildcard `*.texnoidstores.com` added in Vercel for this to resolve.
 *
 * No dependencies, so the storefront's edge middleware can import it.
 */

const DEFAULT_STOREFRONT_URL = "http://localhost:3001";
const DEFAULT_CUSTOM_DOMAIN_TARGET = "cname.vercel-dns.com";

/** DNS allows 63 characters per label; leave room for a "-2"... suffix. */
export const MAX_STORE_SLUG_LENGTH = 50;

/**
 * Names a store can't take, because the subdomain is ours or would mislead
 * shoppers (admin.<domain>, login.<domain>...).
 */
export const RESERVED_STORE_SLUGS: ReadonlySet<string> = new Set([
  "www", "app", "admin", "api", "dashboard", "console", "staff",
  "login", "signin", "signup", "register", "auth", "account", "accounts", "oauth", "sso",
  "mail", "email", "smtp", "imap", "pop", "webmail", "mx", "ns", "ns1", "ns2", "dns",
  "help", "support", "docs", "status", "blog", "news", "about", "contact", "legal", "terms", "privacy",
  "billing", "pay", "payments", "checkout", "secure", "security", "verify",
  "cdn", "static", "assets", "media", "files", "images", "img",
  "dev", "test", "staging", "preview", "demo", "beta", "sandbox",
  "store", "stores", "shop", "shops", "merchant", "merchants", "seller", "sellers",
  "sellly", "texnoid",
]);

const SLUG_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

export function isReservedStoreSlug(slug: string): boolean {
  return RESERVED_STORE_SLUGS.has(slug.trim().toLowerCase());
}

/** Turns a store name into a URL-safe slug: "Aria Jewelry!" → "aria-jewelry". */
export function slugifyStoreName(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, MAX_STORE_SLUG_LENGTH)
    .replace(/-+$/, "");
}

function normalizeDomain(value: string | undefined): string | null {
  const domain = value
    ?.trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/^\*\./, "")
    .replace(/\.$/, "");
  return domain || null;
}

/** The domain stores get subdomains on, or null when stores are reached by path. */
export function storefrontDomain(): string | null {
  return normalizeDomain(process.env.STOREFRONT_DOMAIN);
}

/** The storefront deployment's own address, used for path-style store links. */
export function storefrontBaseUrl(): string {
  return (process.env.STOREFRONT_URL || DEFAULT_STOREFRONT_URL).replace(/\/+$/, "");
}

/** A store's full public URL: https://aria-jewelry.<domain>, or <storefront>/aria-jewelry. */
export function storeUrl(slug: string): string {
  const domain = storefrontDomain();
  return domain ? `https://${slug}.${domain}` : `${storefrontBaseUrl()}/${slug}`;
}

/** A URL without its scheme, for showing to people: "aria-jewelry.texnoidstores.com". */
export function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//, "");
}

/** A store's address as people should see it, without https://. */
export function storeAddress(slug: string): string {
  return displayUrl(storeUrl(slug));
}

/** Where merchants point their own domain's CNAME record. */
export function customDomainTarget(): string {
  return normalizeDomain(process.env.CUSTOM_DOMAIN_CNAME_TARGET) ?? DEFAULT_CUSTOM_DOMAIN_TARGET;
}

export type StoreHost =
  /** A store's own subdomain: serve that store. */
  | { kind: "store"; slug: string }
  /** The storefront's own address (vercel.app, localhost, the bare domain): stores are reached by path. */
  | { kind: "root" }
  /** Anything else — not a host we serve. */
  | { kind: "unknown" };

function storeLabel(label: string): StoreHost {
  return SLUG_PATTERN.test(label) && !isReservedStoreSlug(label) ? { kind: "store", slug: label } : { kind: "unknown" };
}

/**
 * Works out what a request's Host header points at. Only a single label
 * directly under the store domain counts as a store, so `a.b.<domain>` or an
 * unrelated domain is never mistaken for one.
 */
export function resolveStoreHost(rawHost: string, domain: string | null = storefrontDomain()): StoreHost {
  const host = rawHost.trim().toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
  if (!host) return { kind: "unknown" };

  // Local development: localhost:3001/<slug> by path, <slug>.localhost:3001 by subdomain.
  if (host === "localhost" || host === "127.0.0.1") return { kind: "root" };
  if (host.endsWith(".localhost")) return storeLabel(host.slice(0, -".localhost".length));

  // Vercel's own addresses can't have per-store subdomains, so they're path-only.
  if (host.endsWith(".vercel.app")) return { kind: "root" };

  if (domain) {
    if (host === domain || host === `www.${domain}`) return { kind: "root" };
    if (host.endsWith(`.${domain}`)) return storeLabel(host.slice(0, -(domain.length + 1)));
  }

  return { kind: "unknown" };
}
