# Discounts

Types modeled (`DiscountType` enum): `PERCENTAGE`, `FIXED_AMOUNT`, `FREE_SHIPPING`, `BUY_X_GET_Y`. A
`Discount` has one or more `DiscountCode`s, an optional minimum order value, an optional usage limit and
usage counter, start/end dates, and can be scoped to all products or a specific set of products/collections
(`productIds`/`collectionIds` arrays).

## Creation
From the dashboard (`apps/web/app/[store]/discounts/new/page.tsx`) — title, code, type, value, minimum order
value and usage limit.

## Redemption at checkout
`packages/database/src/discounts.ts` (`validateDiscountCode`) re-validates everything server-side at the
moment of checkout — active flag, start/end dates, usage limit, minimum order value, and product/collection
eligibility — rather than trusting anything computed client-side. The storefront checkout form
(`apps/storefront/app/[store]/checkout/_components/checkout-form.tsx`) has a live "Apply" button that calls
this same validation before the order is placed, and `placeOrderAction` re-validates again at submission time
so a code can't be applied to a stale cart. `Discount.usageCount` increments only after an order is
successfully created.

Not yet built: `BUY_X_GET_Y` is modeled but computes zero discount amount today — it needs per-line-item
eligibility logic (which items are the "buy" set vs. the "get" set) that hasn't been implemented.
