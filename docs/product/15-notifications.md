# Notifications

`packages/notifications` implements an event-driven dispatch layer: `dispatchNotification(storeId, event,
recipient, data, channel)` records a `Notification` row (audit trail: pending/sent/failed), renders a
template for the event, and sends it through a registered channel. `notifyOrderEvent(storeId, event, order,
whatsappEnabled, data)` is the entry point order/checkout code actually calls — it fans out to email (when the
order has a customer email) and WhatsApp (when the store has enabled it in Settings), so callers never pick a
channel themselves.

Events: `order_confirmation`, `payment_confirmation`, `order_shipped`, `order_out_for_delivery`,
`order_delivered`, `order_refunded`, `abandoned_cart`. Wired into checkout (order confirmation) and order
fulfillment (`advanceOrderStatusAction` in `apps/web/lib/actions/orders.ts`) today; `abandoned_cart` has a
template but nothing yet triggers it (requires a scheduled job watching carts with no completed checkout,
not built).

## Channels
- **Email** — live via Resend's HTTP API, or a console dry-run log when `RESEND_API_KEY` is unset.
- **WhatsApp** — live via Meta's Cloud API (`WHATSAPP_ACCESS_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID`), or a
  console dry-run log when unset. A store enables it from Settings → Notifications
  (`apps/web/lib/actions/settings.ts`, `toggleWhatsappAction`); the channel itself sends plain text, which
  requires the recipient to have messaged the business number within 24 hours or a pre-approved message
  template in production use — this hasn't been exercised against a live Meta Business account in this
  environment.

Adding a further channel is registering one more entry in the `channels` map inside
`packages/notifications/src/index.ts` — `dispatchNotification`, the templates, and every call site stay
unchanged.
