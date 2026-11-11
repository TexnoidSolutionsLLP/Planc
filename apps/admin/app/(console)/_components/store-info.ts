import type { Domain, PaymentConnection, StoreSettings } from "@sellly/database";
import { storeUrl } from "@sellly/domains";

/** The store's live address: its verified custom domain if it has one, else its free store address. */
export function liveUrl(slug: string, domains: Pick<Domain, "hostname" | "isSubdomain" | "status" | "isPrimary">[]) {
  const custom = domains.find((d) => !d.isSubdomain && d.status === "VERIFIED" && d.isPrimary) ?? domains.find((d) => !d.isSubdomain && d.status === "VERIFIED");
  return custom ? { url: `https://${custom.hostname}`, custom: true } : { url: storeUrl(slug), custom: false };
}

/** Whether checkout can take money — no keys or secrets, just which methods are switched on. */
export function paymentSetup(settings: Pick<StoreSettings, "codEnabled" | "onlinePaymentEnabled"> | null, connections: Pick<PaymentConnection, "provider" | "isActive">[]) {
  const online = connections.filter((c) => c.isActive).map((c) => c.provider);
  if (online.length && settings?.onlinePaymentEnabled) return { label: `Online (${online.join(", ")})${settings.codEnabled ? " + COD" : ""}`, ok: true };
  if (settings?.codEnabled) return { label: "Cash on delivery only", ok: true };
  return { label: "Not set up", ok: false };
}
