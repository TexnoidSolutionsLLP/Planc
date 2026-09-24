# Layout

**Dashboard shell:** fixed 240px sidebar (store switcher + nav) on the left, a 64px header (status, profile)
on top of the content area, main content on a `secondary` background so white cards visually lift off the
page. See `apps/web/app/[store]/layout.tsx`.

**Storefront shell:** optional announcement bar, sticky header (logo, nav, search, cart), full-bleed hero and
content sections, footer. See `apps/storefront/app/[store]/layout.tsx`.

**Forms:** single column, label above field, inline validation below the field, primary action at the bottom
— never a multi-column form for merchant data entry (it's the #1 source of drop-off for non-technical users).
