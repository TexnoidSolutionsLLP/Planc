# Onboarding

Goal: a new merchant publishes a basic, functioning store in under 10 minutes, with the option to skip
anything that isn't strictly required.

Steps (`apps/web/app/onboarding/page.tsx`):
1. **Store name** — required; generates a unique slug.
2. **Category** — required for basic personalization/analytics segmentation later; creates the `Store` row.
3. **First product** — skippable. If completed, creates one `ACTIVE` product with default inventory of 10.
4. **Theme** — choose from Minimal / Modern / Editorial / Luxury / Bold; creates the active `Theme` row.
5. **Payments** — skippable; defaults to Cash on Delivery. Online payment (Razorpay) is connected later from
   Settings, since it requires the merchant to have their own Razorpay account and keys.
6. **Publish** — flips `Store.status` to `PUBLISHED`, sets `publishedAt`, and redirects to the dashboard
   Overview with a success banner and the shareable store link front and center.

Every step after step 1 persists to the database immediately (not just at the end), so a merchant who drops
off mid-wizard keeps whatever they've already completed. `Store.onboardingStep` records progress on the
`Store` row for this purpose; resuming the wizard UI itself at the exact step (rather than restarting it) is
a near-term follow-up, not yet wired into `apps/web/app/onboarding/page.tsx`.
