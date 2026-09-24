# Pricing Model

| Plan | Price | Includes |
|---|---|---|
| Free | ₹0 | Unlimited products, basic storefront, basic orders, platform branding |
| Pro | ₹999/month | Custom domain, advanced analytics, remove branding, discounts, WhatsApp notifications, advanced themes |
| Business | ₹2,499/month | Everything in Pro + staff accounts, automation, abandoned cart recovery, advanced shipping, priority support |

Modeled by `Subscription`/`SubscriptionPlan` in the schema (`packages/database/prisma/schema.prisma`) and
`PLAN_PRICE` in `apps/admin/app/revenue/page.tsx` for MRR reporting.

**This is a hypothesis, not a commitment.** Treat these numbers as a starting point to validate willingness to
pay with real merchants before locking in final pricing or gating features behind paywalls in the product UI.
