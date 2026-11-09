# Sellly admin design system

Based on the supplied finance-dashboard reference, adapted to merchant operations.

- Light canvas, white cards, compact sidebar and a persistent top bar.
- Violet primary actions and selected navigation; mint and amber chart series.
- 18px panel corners, 8px controls, subtle surface shadows and thin table dividers.
- Inter typography with shared 12px captions, 13px secondary copy, 14px body text, 16px section headings, 24–30px page headings and tabular currency values. Form fields use 16px text to avoid automatic zoom on phones.
- Dark theme uses the same component geometry with separate surface and text tokens.

## Implementation

`apps/admin/app/admin-theme.css` scopes tokens and visual rules to the admin app. Other apps retain their existing theme. Shared form, badge, table and card components continue to use the existing UI package.

`apps/admin/components/admin-shell.tsx` provides navigation, search, profile actions, theme controls and the mobile drawer for both real and demo routes. Real routes retain their server-side authorization. The global search opens the Stores page and applies its query.

`apps/admin/components/admin-overview.tsx` is shared by the real dashboard and its demo. `apps/admin/lib/admin-overview.ts` supplies authenticated platform aggregates for the last seven days in IST. Individual store sales and customer data retain their existing grant checks.

The overview opens with **Needs attention** (suspended stores, stores in draft, open access approvals; each links to the filtered list), then merchant sales, plans with MRR, and orders. There is no marketing banner, workspace card or sidebar promo, and the merchant directory lives on its own `/merchants` page. `apps/admin/components/demo-overview.tsx` supplies local fixtures to the shared dashboard. Its merchant GMV excludes cancelled orders and distinguishes paid orders from cash on delivery. The demo is a development preview, not live analytics. The authenticated route uses real database results, handles zero stores and orders, and separates pending/unrecorded payments from paid online and cash-on-delivery sales. Subscription MRR includes only active plans.

The real staff sign-in page uses the same design tokens, a violet brand panel, accessible password visibility control and the existing authentication action.

Validation: TypeScript, real-browser login layouts at 1440/768/390/320px, password visibility, shared charts, real-route links and zero-data rendering. Live authentication and SQL execution remain unverified without local Supabase/database configuration.

The desktop sidebar can collapse; the phone layout uses a dismissible drawer. Tables scroll inside their panels. Charts have accessible summaries and controls, and transitions respect reduced-motion preferences.

## UI/UX refinement

Reviewed against the Web Interface Guidelines: https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md.

The admin theme now uses consistent text roles and panel spacing. HTML chart axes and donut labels stay readable when graphics resize. Numeric table columns align to the right, and optional named table regions support keyboard scrolling. Primary controls have larger targets, focus states stay visible, the main content has a skip link, notifications dismiss with Escape, and login errors receive focus. The mobile drawer retains focus containment and restores focus on dismissal.

Checked with axe-core 4.10.3 (WCAG 2 A/AA, WCAG 2.1 AA and best-practice rules): no reported violations on the demo overview, stores, orders, revenue, access, audit, health, sample store detail and real login screens in light mode; overview and login also passed in dark mode. This covers the rendered screens and automated checks, not a conformance certification.

Manual browser checks passed for skip navigation, notifications, mobile drawer focus, chart data disclosure and keyboard table scrolling. No page overflow at 320, 390, 768, 1024, 1280 or 1440px, or with 200% text sizing. Live authenticated data remains unavailable without Supabase configuration.

## Visual world (Nov 2026 redesign)

`apps/admin/app/admin-skin.css` loads after `admin-theme.css` and owns the look; `admin-theme.css` keeps layout and responsive rules.

- **Type:** Figtree (via `next/font`, exposed as `--font-admin`) for everything: friendly but businesslike. Use weights 400–600, with 700 only for the brand. Numbers use tabular figures. Sizes are nudged up about 0.5px over the Inter scale because Figtree's lowercase letters are shorter.
- **Restrained:** neutrals carry the interface. Use no section colours, gradients or tinted cards.
- **One accent:** indigo `#4F46E5`, only for the current nav item's icon, primary buttons, links and focus rings.
- **Status colours:** red, amber and green appear only in status badges and the "Needs attention" icons.
- **Sidebar:** the page-background neutral with a 1px border. The current page is a white pill with a hairline border.
- **Tables:** neutral header row in sentence case. Rows get a faint neutral hover.
- **Overview:** the layout, top to bottom:
  - A header with "Overview" on the left and the period on the right.
  - One bordered strip of four numbers, each a link: Merchant sales → Revenue, Stores → Stores, Plan revenue → Revenue, Orders → Orders.
  - Two panels side by side (stacked below 1100px): "Needs attention" (only non-zero items) and "New stores" (the five newest stores with owner, status and date, each linking to the store).
  - No charts, donuts or coloured tiles.
