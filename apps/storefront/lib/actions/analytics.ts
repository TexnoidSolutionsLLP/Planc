"use server";

import { prisma } from "@sellly/database";
import { trackEvent, type AnalyticsEventType } from "@sellly/analytics";

/** Storefront client components can't hold a storeId, only the slug — this
 * resolves it server-side before writing the event. */
export async function trackClientEvent(storeSlug: string, type: AnalyticsEventType, metadata?: Record<string, unknown>) {
  const store = await prisma.store.findUnique({ where: { slug: storeSlug }, select: { id: true } });
  if (!store) return;
  await trackEvent(store.id, type, metadata);
}
