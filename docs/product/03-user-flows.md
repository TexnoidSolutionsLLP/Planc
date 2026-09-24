# User Flows

## Merchant onboarding
Sign up → Create store (name) → Category → Add first product (skippable) → Choose theme → Connect payment
(skippable, defaults to COD) → Publish → Share link.

Implemented in `apps/web/app/onboarding/page.tsx` with server actions in
`apps/web/lib/actions/onboarding.ts`. Every step but store name is skippable — the merchant can always finish
these from the dashboard later, since the goal is publishing fast, not configuring completely.

## Customer flow
Instagram/WhatsApp bio link → Storefront homepage → Collection → Product page → Add to cart / Buy now → Cart
→ Checkout (contact + shipping address) → Payment (COD or online) → Order confirmation → Order tracking.

Implemented across `apps/storefront/app/[store]/**`. "Buy now" skips the cart drawer and goes straight to
checkout with the single item added — this shortens the path for the common case of a customer arriving from
a single product link shared in a DM.

## Merchant fulfillment flow
New order notification → Order detail (`apps/web/app/[store]/orders/[id]/page.tsx`) → Advance status
(Pending → Confirmed → Processing → Packed → Shipped → Out for Delivery → Delivered) → Customer notified at
each meaningful transition (shipped, out for delivery, delivered) via `@sellly/notifications`.
