# Accessibility

Baseline target: WCAG 2.1 AA.

- **Keyboard navigation** — all interactive elements (nav links, buttons, form fields, cart controls) are
  native `<button>`/`<a>`/`<input>` elements, reachable and operable via keyboard by default; no click handlers
  on non-interactive `div`s.
- **Focus states** — every focusable element gets a visible 3px brand-blue focus ring (`focus-visible:ring-[3px] focus-visible:ring-brand/25`), never `outline: none` without a replacement.
- **Labels** — every form input has an associated, visible `<label>`; icon-only buttons (cart, close, remove
  item) carry `aria-label`.
- **Contrast** — primary text (`#0F172A` on `#FFFFFF`) exceeds 15:1; secondary text (`#475569`) passes AA for body-size
  text; the lighter `#94A3B8` is used only for placeholders and non-essential captions; status colors are always paired with text, not used as the sole signal.
- **Semantic HTML** — headings in order (h1 → h2 → h3), lists as `<ul>/<li>`, tables as real `<table>` markup
  with `<th>` headers (see `packages/ui/src/components/table.tsx`).
- **Screen readers** — dynamic content (cart count, form errors) uses plain text nodes that update in place
  rather than canvas/SVG-rendered numbers.
- **Reduced motion** — `prefers-reduced-motion` collapses all animation/transition durations to near-zero
  (`packages/ui/styles/globals.css`, shared by every app).

## Additions with the premium design system
- Sidebar links set `aria-current="page"`; the date-range control and product filters expose their state.
- Icon-only buttons (menu, notifications, theme toggle, dismiss toast) have `aria-label`s; the search field has a visible-to-AT label.
- Touch targets are 44px on phones (buttons and inputs step down to 40px from `sm`).
- Trend arrows and status badges always include text; checklist completion also has screen-reader text.
- Dark mode keeps AA contrast: text `#FAFAFA` on `#09090B`, brand `#3B82F6`.
