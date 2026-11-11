"use client";

import { useEffect, useRef } from "react";
import { trackClientEvent } from "@/lib/actions/analytics";

/**
 * Records a page view from the shopper's browser after the page loads.
 * Store pages are served from cache, so server code no longer runs on every
 * view; this also leaves out crawlers that don't run JavaScript.
 */
export function PageViewTracker({ storeSlug, page, productId }: { storeSlug: string; page: "home" | "product"; productId?: string }) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    trackClientEvent(storeSlug, "page_view", productId ? { page, productId } : { page }).catch(() => {});
  }, [storeSlug, page, productId]);

  return null;
}
