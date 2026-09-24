# Payments

## Provider architecture
`packages/payments` defines a `PaymentProvider` interface (`createPaymentIntent`, `verifyWebhook`, `refund`)
so checkout and order code never depend on a specific gateway's SDK. Two implementations exist today:
`codProvider` (no-op, order confirmed immediately) and `createRazorpayProvider` (talks to the Razorpay REST
API directly over `fetch`, no SDK dependency).

## Security rule
**Client-side payment success is never trusted.** Orders paid online stay `PENDING` until Razorpay's signed
webhook (`apps/storefront/app/api/webhooks/razorpay/route.ts`) is verified with an HMAC-SHA256 signature check
against the store's webhook secret — only then does the order move to `CONFIRMED` and the payment to `PAID`.

## Per-store credentials
Each store connects its own Razorpay account (`PaymentConnection` model) from Settings → Payments
(`apps/web/lib/actions/settings.ts`). Keys are stored per-store, not globally, since every merchant settles to
their own bank account. In production the secret is encrypted at rest (e.g. via a KMS-backed field) before
being written to `payment_connections.encryptedSecret` — the current implementation stores it directly and is
flagged for that hardening pass before launch.

## Cash on Delivery
Modeled as a provider (`codProvider`) for symmetry with online payments, even though it has no real API calls
— this keeps checkout logic uniform regardless of payment method.
