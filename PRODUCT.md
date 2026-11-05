# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Instagram/WhatsApp seller (primary).** Sells jewelry, fashion, beauty or home goods in India, today entirely through DMs. Not technical; runs the business on a phone between replying to customers. Needs a store link for their bio, payment without arguing over UPI screenshots, and simple order tracking.
- **Home baker / small D2C brand.** Takes pre-orders via spreadsheets or WhatsApp broadcast lists. Wants collections, simple discounts for regulars, and to look more "official" than a DM business.
- **Reseller / boutique owner.** Tens to hundreds of SKUs. Cares about inventory accuracy and fulfilment speed more than storefront looks; first to need bulk status changes, low-stock visibility and staff accounts.
- **Shoppers.** The merchants' customers, arriving from an Instagram bio, WhatsApp status or DM link, usually on a phone and often on a slow network.
- **Sellly staff (internal).** Monitor merchant health, platform revenue, abuse and support load across stores via `apps/admin`.

## Product Purpose

Sellly turns a social audience into a real online store in minutes, without e-commerce or technical knowledge. It replaces the manual DM workflow (every message, payment screenshot and shipping address) with one loop: Instagram / WhatsApp → store link → product → cart → checkout → payment → order → shipping → notification.

Success: a new merchant publishes a basic store in under 10 minutes and gets a first order.

## Positioning

Not "another Shopify." Sellly optimises for the narrowest, sharpest job: the fastest path from a social audience to a published store to a first order. Longer-term differentiation is AI-assisted store creation and product enrichment, built on a fast, reliable commerce core, not feature breadth. Broader capability (marketing automation, deep shipping, multi-channel) is earned after the core loop is validated.

## Operating Context

- Three apps: `apps/web` (marketing landing page plus merchant dashboard, onboarding wizard), `apps/storefront` (customer stores, multi-tenant by subdomain), `apps/admin` (internal staff console).
- Merchants share one link in their Instagram bio, WhatsApp status and DMs; shoppers land straight on products.
- Cash on delivery works immediately; merchants can connect their own Razorpay account (UPI, cards, net banking, wallets) with money settling to them directly.
- Customers get order updates by email and WhatsApp.
- Sellly staff have no standing access to store data: they request time-limited, scoped access that only the store owner can approve or revoke (merchant dashboard, *Sellly access*).

## Capabilities and Constraints

- Stack: Next.js, React, TypeScript, Tailwind, Supabase (Postgres, Auth, Storage), Prisma, Razorpay, Shiprocket, Resend + WhatsApp Cloud API, Claude API for AI features. Deployed on Vercel (sin1).
- Features: onboarding wizard, products and collections, orders, customers, discounts, analytics, theme/store builder with storefront templates, notifications, AI Store Builder and AI Product Assistant, subscriptions.
- Pricing is a **hypothesis, not a commitment**: Free ₹0, Pro ₹999/month, Business ₹2,499/month (`docs/product/05-pricing.md`). Don't present it as final or gate UI behind it without confirmation.
- Razorpay, Shiprocket, WhatsApp, AI and storage are real integrations but not yet exercised end-to-end against live accounts (`docs/product/04-feature-map.md`).
- Detailed specs live in `docs/product/` (flows, features) and `docs/design/` (existing design reference).

## Brand Commitments

- Name: **Sellly** (working product name). Line: *Turn your social audience into a store.*
- Voice: direct, encouraging, never condescending. Avoid e-commerce jargon; users are running a business on a phone.
- The platform chrome recedes. Nothing should compete with the merchant's own product photography once a store is live.

## Evidence on Hand

- Pre-launch: **no real merchants, testimonials, customer logos, case studies or usage metrics exist.** Future work must not fabricate any.
- Sample figures in the landing page's dashboard preview (`apps/web/components/marketing/dashboard-preview.tsx`) and the admin `/demo` route are illustrative fixtures and must read as such, never as traction.
- Seeded demo store `aria-jewelry` with fictional products, customers and orders exists for development.

## Product Principles

1. **Speed to first order beats breadth.** Every flow is judged by how quickly a non-technical seller gets from link to paid order.
2. **Phone first, low bandwidth always.** Merchants manage from a phone and shoppers arrive from social apps on mobile networks.
3. **The merchant's product is the hero.** Platform UI supports their photography and brand; it never upstages them.
4. **Plain words over commerce vocabulary.** Explain things the way a seller already talks about their business.
5. **Trust is earned and shown honestly.** Merchant data stays merchant-controlled, and the product never claims proof it doesn't have.

## Accessibility & Inclusion

- WCAG 2.1 AA baseline across all apps (`docs/design/21-accessibility.md`): visible focus rings, labelled inputs, status never by colour alone, reduced-motion respected.
- 44px touch targets on phones; 16px form text to avoid iOS zoom.
- Storefront pages must load fast on any network (shoppers arrive from social apps on mobile data).
