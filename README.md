# Sellly

Turn your social audience into a store. A multi-tenant social-commerce SaaS for Instagram sellers, creators, boutiques, resellers and small D2C brands.

## Stack

Next.js · React · TypeScript · Tailwind CSS · PostgreSQL · Prisma · Auth.js · Razorpay (payments) · Shiprocket (shipping) · Resend + WhatsApp Cloud API (notifications) · Cloudflare R2 / S3 (media) · Claude API (AI features)

## Structure

```
apps/
  web/          merchant dashboard (localhost:3000)
  storefront/   customer-facing store, multi-tenant by subdomain (localhost:3001)
  admin/        platform admin (localhost:3002)
packages/
  ui/           shared design system (tokens + components)
  database/     Prisma schema + tenant-scoped query layer + discount validation, audit logging, encryption
  auth/         Auth.js config, password hashing, tenant access checks
  payments/     PaymentProvider interface + Razorpay/COD adapters
  shipping/     ShippingProvider interface + flat-rate default + Shiprocket adapter
  notifications/ event-driven notification dispatch (email + WhatsApp)
  analytics/    store overview, revenue, top products & conversion funnel queries
  storage/      presigned S3/R2 upload URLs for product & collection images
  theme/        theme section config types + defaults, shared by dashboard and storefront
  rate-limit/   in-memory rate limiter for auth, checkout and AI endpoints
  ai/           AI Store Builder & AI Product Assistant via the Claude API
docs/
  product/      product vision, personas, flows, feature specs
  design/       design system reference
```

## Getting started

```bash
pnpm install
cp .env.example .env       # fill in DATABASE_URL and ENCRYPTION_KEY at minimum
pnpm db:generate
pnpm db:migrate             # creates tables
pnpm db:seed                # demo store + logins (see below)
pnpm test                  # runs the unit test suite (packages/*/src/**/*.test.ts)

pnpm dev:web                # http://localhost:3000
pnpm dev:storefront          # http://localhost:3001
pnpm dev:admin                # http://localhost:3002
```

Seeded logins:
- Merchant: `demo@sellly.app` / `password123` (store: `aria-jewelry`)
- Platform admin: `admin@sellly.app` / `password123` (use on `apps/admin`)

Visit the seeded store at `http://aria-jewelry.localhost:3001` (or `http://localhost:3001/aria-jewelry` if your
system doesn't resolve `*.localhost` subdomains).

## Tenant isolation & security

- Every store-scoped query goes through `getTenantDb(storeId)` from `@sellly/database`, which forces `storeId`
  into every `where`/`create` clause. Every dashboard route calls `requireStore(slug)` first, which checks the
  signed-in user is a member of that store before any data loads — see `apps/web/lib/session.ts`.
- Payment credentials (Razorpay key secret, webhook secret) are encrypted at rest with AES-256-GCM before being
  written to the database (`packages/database/src/crypto.ts`) — never stored in plaintext.
- Every order/product/settings/theme mutation writes an `AuditLog` row (`writeAuditLog`), giving platform
  support a trail of what changed and by whom.
- Auth (login/signup) and checkout are rate-limited per IP (`@sellly/rate-limit`) to slow down brute-force and
  abuse; this is a single-instance in-memory limiter — swap for Redis before running multiple instances.

## Payments

`packages/payments` defines a provider-agnostic interface. Checkout re-prices orders server-side from the database
(never trusts client-submitted totals), creates a real Razorpay order for online payments, and only marks a
payment `PAID` after a signed webhook is verified — see `apps/storefront/app/api/webhooks/razorpay/route.ts`.

## What needs live credentials to fully exercise

Razorpay checkout, Shiprocket shipping, WhatsApp notifications, AI features, and image uploads to R2/S3 are all
real integrations, not stubs — but this build environment has no live vendor accounts or a running Postgres
instance, so end-to-end behavior against those services hasn't been exercised here. See
`docs/product/04-feature-map.md` for exactly what's been verified (build/typecheck/unit tests) vs. what still
needs a live account to prove out.

## Roadmap

See `docs/product/04-feature-map.md` for the phased build order and current status of every phase.
