# Storefront Design

The storefront (`apps/storefront`) is intentionally more editorial than the dashboard: content sits on the
page background rather than in cards, imagery leads, and the accent color barely appears (reserved for
discount badges and success states).

Homepage section order (data-driven per theme, see `docs/product/14-store-builder.md`):
Announcement bar → Header → Hero → Featured collection → Product grid → Promotional banner → Testimonials →
FAQ → Newsletter → Footer.

Product page priority order: image gallery, name, price/compare price/discount, variant selector, quantity,
Add to cart / Buy now, description, shipping & returns, reviews, related products — in that order, so the
purchase decision (price, options, CTA) never requires scrolling past marketing copy.

Cart uses a slide-in drawer for quick edits and a full page (`/cart`) for a complete review before checkout —
both share the same `useCart` state so they never drift out of sync.
