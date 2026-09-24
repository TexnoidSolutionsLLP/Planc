# AI Store Builder & AI Product Assistant

Both features are implemented against the Claude Messages API (`packages/ai`, no SDK dependency — a thin
`fetch` wrapper in `packages/ai/src/client.ts`, the same pattern as the Razorpay/Shiprocket adapters). Both
require `ANTHROPIC_API_KEY` to be set; without it, both fail with an explicit "AI features aren't configured"
message rather than silently doing nothing.

## AI Store Builder
Merchant enters a free-text business description (e.g. "I sell premium handmade jewelry in Hyderabad. I want
a minimal luxury store.") from Online Store → AI Store Builder
(`apps/web/app/[store]/online-store/_components/ai-store-builder.tsx`). `generateStoreBuilderDraft` returns a
homepage headline, subheading, CTA label, a theme recommendation, and 2–4 suggested collections with
descriptions. This is shown as a draft — **nothing is written to the database until the merchant clicks
"Approve & apply"** (`applyStoreBuilderDraftAction`), which updates the active theme's hero section content
and creates the suggested collections. The merchant then edits/removes anything they don't want through the
normal Collections and Online Store pages.

## AI Product Assistant
On the product create/edit form, once at least one image is uploaded, an "AI Product Assistant" panel appears
(`apps/web/app/[store]/products/_components/ai-product-assistant.tsx`). `generateProductCopyAction` fetches
the uploaded image server-side, base64-encodes it, and sends it to Claude's vision input alongside a prompt
asking for name, description, SEO title/description, tags, category, a suggested price, an Instagram caption
and a WhatsApp message. The result is shown as a draft with an explicit "Apply to product" button that fills
the name/description/price/tags fields — the merchant still reviews and saves the form themselves.

## Rate limiting
Both actions are rate-limited per store (`@sellly/rate-limit`) — 20 product-copy generations and 10
store-builder generations per hour — since each call costs real API usage.

## Not built
AI Marketing (bulk caption/ad-copy generation across many products at once) is not implemented; both features
above operate on one product or one store description at a time.
