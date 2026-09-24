# Shipping

`packages/shipping` defines a `ShippingProvider` interface (`getRates`, `createShipment`, `track`, `cancel`)
so a real carrier integration can be dropped in without touching checkout or order code. Two implementations
exist:

- **`createFlatRateProvider`** — the default. One flat rate per store (with an optional free-shipping
  threshold), configured in `StoreSettings.shippingFlatRate` / `StoreSettings.freeShippingMin`, used by
  checkout (`apps/storefront/lib/actions/checkout.ts`) to compute `shippingTotal` server-side.
- **`createShiprocketProvider`** (`packages/shipping/src/providers/shiprocket.ts`) — a real integration
  against Shiprocket's REST API: authenticates with email/password (caching and refreshing the bearer token),
  fetches live courier rates for a pickup/delivery pincode pair, creates a shipment, tracks an AWB, and
  cancels a shipment. This is code-complete but hasn't been exercised against a live Shiprocket account in
  this build environment — see `04-feature-map.md`.

Order-level tracking fields (`trackingNumber`, `trackingUrl`, `carrier` on `Order`; the `Shipment` model for
multi-parcel orders) exist in the schema and are what a real carrier integration populates — the order detail
page and customer tracking page already render whatever is there.

Not yet wired: swapping the flat-rate default for Shiprocket in the checkout flow itself (both providers
exist and satisfy the same interface, but checkout currently always uses the flat-rate provider — plugging in
Shiprocket per-store is a config lookup away, not a rewrite), and carrier webhook-driven status updates
(status moves are still manual merchant actions on the order).
