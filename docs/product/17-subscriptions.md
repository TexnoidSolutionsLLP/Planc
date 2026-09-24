# Subscriptions (platform billing)

Every `Store` has a `Subscription` (`plan`: FREE/PRO/BUSINESS, `status`: ACTIVE/PAST_DUE/CANCELLED,
`currentPeriodEnd`). New stores default to `FREE` at creation (`createStoreAction` in
`apps/web/lib/actions/onboarding.ts`).

Currently the plan is a label only — nothing in the product gates features by plan yet (e.g. custom domains
and advanced analytics are described as Pro-only in `05-pricing.md` but not actually restricted in code). This
is deliberate for the MVP: prove the core loop works before adding billing friction. Platform admin reports
Monthly Recurring Revenue from these rows (`apps/admin/app/revenue/page.tsx`, `PLAN_PRICE` lookup) purely as a
hypothetical/target number until real billing (a payment-provider subscription product, e.g. Razorpay
Subscriptions) is wired to actually charge and update `Subscription.status`.

Not built: the billing flow itself (checkout for a plan, recurring charge webhooks, downgrade/cancellation
handling, feature gating middleware).
