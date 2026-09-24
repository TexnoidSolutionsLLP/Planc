# Social Commerce

The entire product is built around one behavior: a seller puts a single storefront link in their Instagram
bio or WhatsApp status, and every DM conversation about a product can end with "here's the link" instead of a
manual back-and-forth over price, availability and payment.

What's built: the storefront itself is the "social commerce surface" — mobile-first, fast to load on a phone
network, with a "Buy now" path on the product page that goes straight to checkout for the common case of
someone arriving from a single shared product link (`apps/storefront/app/[store]/products/[slug]/_components/
add-to-cart-form.tsx`).

What's not yet built (Phase 7 in the roadmap): direct platform integrations — an Instagram Shopping catalog
feed, WhatsApp Business Catalog sync, "message the seller" deep links from a product page, or automated
posting of new products to social channels. These are additive on top of the existing `Product`/`Store` data
and don't require schema changes to add later.
