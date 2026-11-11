"use server";

import { headers } from "next/headers";
import { prisma } from "@sellly/database";
import { trackEvent, type AnalyticsEventType } from "@sellly/analytics";

const CLIENT_EVENTS = new Set<AnalyticsEventType>(["page_view", "add_to_cart"]);
const BOT_PATTERN = /bot|crawl|spider|slurp|preview|headless|lighthouse|facebookexternalhit|whatsapp/i;
const MAX_METADATA_CHARS = 500;

/**
 * Storefront client components can't hold a storeId, only the slug — this
 * resolves it server-side before writing the event. Anyone can call a server
 * action, so only the events the storefront actually sends are accepted, bots
 * are skipped, and oversized metadata is dropped.
 */
export async function trackClientEvent(storeSlug: string, type: AnalyticsEventType, metadata?: Record<string, unknown>) {
  if (!CLIENT_EVENTS.has(type)) return;
  if (BOT_PATTERN.test(headers().get("user-agent") ?? "")) return;

  const store = await prisma.store.findUnique({ where: { slug: storeSlug }, select: { id: true, status: true } });
  if (!store || store.status !== "PUBLISHED") return;

  const safeMetadata = metadata && JSON.stringify(metadata).length <= MAX_METADATA_CHARS ? metadata : undefined;
  await trackEvent(store.id, type, safeMetadata);
}
