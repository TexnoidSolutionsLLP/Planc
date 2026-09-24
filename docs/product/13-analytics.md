# Analytics

`packages/analytics` provides the store-level queries used by both the dashboard Overview and the dedicated
Analytics page:

- `getStoreOverview(storeId, since)` — revenue, order count, new customers, average order value, refunds,
  all computed live from `Order`/`Customer` rows (no pre-aggregated rollup table yet — fine at current scale,
  worth revisiting with a materialized view or scheduled rollup once stores have high order volume).
- `getTopProducts(storeId, since, limit)` — units sold, grouped from `OrderItem`.
- `getRevenueByDay(storeId, since)` — feeds the revenue-over-time area chart (`recharts`,
  `apps/web/app/[store]/analytics/_components/revenue-chart.tsx`).
- `getConversionFunnel(storeId, since)` — store visits → add to cart → checkout started → orders placed,
  and the conversion rate derived from it (orders placed ÷ store visits).

## Event tracking
`AnalyticsEvent` rows (`page_view`, `add_to_cart`, `checkout_started`, `order_placed`) are written by the
storefront itself: home and product pages call `trackEvent` server-side on render
(`apps/storefront/app/[store]/page.tsx`, `.../products/[slug]/page.tsx`), checkout does the same on page load
and on successful order placement, and "Add to cart" / "Buy now" call a `trackClientEvent` server action from
the client (`apps/storefront/lib/actions/analytics.ts`) since the browser only knows the store's slug, not its
internal id. The conversion funnel and rate shown in the dashboard are computed directly from these rows —
nothing is estimated or hardcoded.
