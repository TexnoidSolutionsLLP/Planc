# Feature Map & Build Phases

| Phase | Scope | Status |
|---|---|---|
| 1 | Foundation, monorepo, Prisma schema, Auth.js, tenant isolation layer | **Built** |
| 2 | Onboarding wizard, dashboard shell, products, collections, image uploads | **Built** |
| 3 | Storefront (home/product/cart/checkout/confirmation/tracking/search/404) | **Built** |
| 4 | Payments (Razorpay checkout + COD, webhook verification), orders, customers | **Built** |
| 5 | Themes, visual store customizer (drag-and-drop sections, color, live preview), custom domains | **Built** |
| 6 | Analytics (funnel + revenue charts), discounts (creation + checkout redemption), notifications (email + WhatsApp) | **Built** |
| 7 | Shipping (Shiprocket adapter, code-complete pending live credentials), WhatsApp notifications, social commerce | **Built / partial** |
| 8 | AI Store Builder, AI Product Assistant | **Built** |

Execution rule for every phase: Build → Test → Fix → Refactor → Document → Continue. Do not build every
advanced feature before the core commerce loop (signup → store → product → checkout → order) is solid.

## What's genuinely code-complete vs. what needs live credentials to prove out

Everything above is implemented and typechecks/builds cleanly, and the pure business logic (discount
validation, webhook signature verification, rate limiting, encryption, theme config normalization) has an
automated test suite (`pnpm test`, `packages/*/src/**/*.test.ts`). What hasn't been exercised against a real
external service in this environment (no live Postgres, no vendor accounts available here):

- **Razorpay**: checkout creates a real Razorpay order via their REST API and only confirms payment from a
  signature-verified webhook — needs a live Razorpay account + webhook secret to prove end-to-end.
- **Shiprocket**: `packages/shipping/src/providers/shiprocket.ts` implements auth, rates, shipment creation,
  tracking and cancellation against Shiprocket's real API — needs a live account to exercise.
- **WhatsApp (Meta Cloud API)**: `packages/notifications` sends real messages when `WHATSAPP_ACCESS_TOKEN` /
  `WHATSAPP_PHONE_NUMBER_ID` are set, and dry-run logs otherwise — needs a Meta Business account to prove out.
- **AI Store Builder / AI Product Assistant**: call the Claude Messages API directly — needs `ANTHROPIC_API_KEY`
  to run; both features fail with a clear "not configured" message otherwise rather than silently no-op'ing.
- **Object storage (R2/S3)**: product/collection image upload needs `STORAGE_ENDPOINT` /
  `STORAGE_BUCKET` / access keys configured — see `.env.example`.

None of these are stubs or fakes — they're real API integrations that simply haven't been run against a live
account in this build environment.
