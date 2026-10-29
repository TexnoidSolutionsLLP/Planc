# SMBPROJECT

Turn your social audience into a store. A multi-tenant social-commerce SaaS for Instagram sellers, creators, boutiques, resellers and small D2C brands.

## Stack

Next.js · React · TypeScript · Tailwind CSS · Supabase (PostgreSQL, Auth, Storage) · Prisma · Razorpay (payments) · Shiprocket (shipping) · Resend + WhatsApp Cloud API (notifications) · Supabase Storage (media) · Claude API (AI features)

## Structure

```
apps/
  web/          merchant dashboard (localhost:3000)
  storefront/   customer-facing store, multi-tenant by subdomain (localhost:3001)
  admin/        platform admin (localhost:3002)
packages/
  ui/           shared design system (tokens + components)
  database/     Prisma schema + tenant-scoped query layer, staff access requests, discount validation, audit logging, encryption
  auth/         Supabase Auth sessions, profile linking, tenant access checks, staff setup scripts
  payments/     PaymentProvider interface + Razorpay/COD adapters
  shipping/     ShippingProvider interface + flat-rate default + Shiprocket adapter
  notifications/ event-driven notification dispatch (email + WhatsApp)
  analytics/    store overview, revenue, top products & conversion funnel queries
  storage/      Supabase Storage signed upload URLs for product & collection images
  theme/        theme section config types + defaults, shared by dashboard and storefront
  rate-limit/   in-memory rate limiter for auth, checkout and AI endpoints
  ai/           AI Store Builder & AI Product Assistant via the Claude API
docs/
  product/      product vision, personas, flows, feature specs
  design/       design system reference
  DEPLOYMENT.md step-by-step Supabase + Vercel setup
```

## Getting started

You need Node 20+, pnpm 9, a Postgres database and a Supabase project (the free tier is fine for development).

```bash
pnpm install
cp .env.example .env                       # fill it in — every variable is explained inside
cp .env packages/database/.env             # Prisma's CLI reads this copy
pnpm db:migrate                            # creates tables and access-control rules
pnpm db:seed                               # demo store, products, customers, orders
pnpm storage:setup                         # creates the image bucket in Supabase Storage
pnpm staff:create --email you@company.com  # your Sellly staff login for apps/admin
pnpm test                                  # unit tests (+ access-control integration tests if TEST_DATABASE_URL is set)

pnpm dev:web                # http://localhost:3000
pnpm dev:storefront         # http://localhost:3001
pnpm dev:admin              # http://localhost:3002
```

Seeded merchant login: `demo@sellly.app` / `password123` (store: `aria-jewelry`). The seed creates this login in
Supabase when `SUPABASE_SERVICE_ROLE_KEY` is set, and refuses to run in production. There is no seeded staff
account; `staff:create` prints a one-time password.

Visit the seeded store at `http://aria-jewelry.localhost:3001` (or `http://localhost:3001/aria-jewelry` if your
system doesn't resolve `*.localhost` subdomains).

Deploying: see [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Tenant isolation & security

- Every store-scoped query goes through `getTenantDb(storeId)` from `@sellly/database`, which forces `storeId`
  into every `where`/`create` clause. Every dashboard route calls `requireStore(slug)` first, which checks the
  signed-in user is a member of that store before any data loads — see `apps/web/lib/session.ts`.
- Payment credentials (Razorpay key secret, webhook secret) are encrypted at rest with AES-256-GCM before being
  written to the database (`packages/database/src/crypto.ts`) — never stored in plaintext.
- Every order/product/settings/theme mutation writes an `AuditLog` row (`writeAuditLog`), giving platform
  support a trail of what changed and by whom.
- **Sellly staff never have standing access to a store's private data.** Staff (`platformRole = PLATFORM_ADMIN`,
  created only by `pnpm staff:create`) request access to one store, one area, view and/or change, for a limited
  time. Only that store's merchant owner can approve it (in the dashboard under *Sellly access*), approvals
  expire, and the owner can revoke them at any time. The rules live in `packages/database/src/access.ts`
  and are enforced again by CHECK constraints and a trigger in the database. Every protected read and write in
  `apps/admin` checks for a live grant on the server.
- Supabase's public REST API is locked out of every table (RLS on, no policies, privileges revoked). The apps
  only reach the database through Prisma on the server.
- Auth (login/signup) and checkout are rate-limited per IP (`@sellly/rate-limit`) to slow down brute-force and
  abuse; this is a single-instance in-memory limiter — swap for Redis before running multiple instances.

## Payments

`packages/payments` defines a provider-agnostic interface. Checkout re-prices orders server-side from the database
(never trusts client-submitted totals), creates a real Razorpay order for online payments, and only marks a
payment `PAID` after a signed webhook is verified — see `apps/storefront/app/api/webhooks/razorpay/route.ts`.

## What needs live credentials to fully exercise

Razorpay checkout, Shiprocket shipping, WhatsApp notifications, AI features, and image uploads to Supabase Storage are all
real integrations, not stubs — but this build environment has no live vendor accounts or a running Postgres
instance, so end-to-end behavior against those services hasn't been exercised here. See
`docs/product/04-feature-map.md` for exactly what's been verified (build/typecheck/unit tests) vs. what still
needs a live account to prove out.

## Roadmap

See `docs/product/04-feature-map.md` for the phased build order and current status of every phase.
