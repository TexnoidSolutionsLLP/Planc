# Orders

## Status lifecycle
`PENDING → CONFIRMED → PROCESSING → PACKED → SHIPPED → OUT_FOR_DELIVERY → DELIVERED`, with side branches
`CANCELLED`, `FAILED`, `REFUNDED`, `RETURNED`. Modeled as the `OrderStatus` enum
(`packages/database/prisma/schema.prisma`); the forward flow is `ORDER_STATUS_FLOW` in
`apps/web/lib/order-status.ts`.

COD orders are created as `CONFIRMED` immediately (payment happens at delivery); online-payment orders are
created `PENDING` and only move to `CONFIRMED` once a signed Razorpay webhook reports `paid` — see
`10-payments.md`.

## Order detail
Every order (`apps/web/app/[store]/orders/[id]/page.tsx`) shows: customer, line items with subtotal/shipping/
discount/total breakdown, payment status, shipping address + tracking number, a full status timeline
(`OrderEvent` rows), and the next valid status transition as a single primary action — matching the "one
primary action per screen" design principle rather than a free-form status dropdown.

## Fulfillment
Merchants advance status one step at a time (`advanceOrderStatusAction`); cancellation is available any time
before `DELIVERED`. Status changes that matter to the customer (shipped, out for delivery, delivered,
refunded) trigger a notification via `@sellly/notifications`.
