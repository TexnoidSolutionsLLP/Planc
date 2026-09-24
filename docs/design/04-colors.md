# Colors

Neutral-first: roughly 90% neutral, 8% brand blue, 2% semantic. The interface should look almost monochrome, with
blue appearing where interaction and importance matter (primary buttons, links, active nav icon, selected
states, focus rings, key chart series).

All colors are CSS variables holding RGB channels (`packages/ui/styles/globals.css`), mapped to Tailwind tokens in
`packages/ui/tailwind-preset.ts`. Dark mode is a single remap of the same variables.

| Tailwind token | Light | Dark | Use |
|---|---|---|---|
| `background` | `#F8FAFC` | `#09090B` | Page background |
| `surface` | `#FFFFFF` | `#111113` | Cards, inputs, sidebar |
| `secondary` | `#F1F5F9` | `#18181B` | Hover and active fills |
| `primary` (text) | `#0F172A` | `#FAFAFA` | Primary text |
| `muted` | `#475569` | `#A1A1AA` | Secondary text |
| `subtle` | `#94A3B8` | `#71717A` | Placeholders, captions (never body copy) |
| `border` / `border-strong` | `#E2E8F0` / `#CBD5E1` | `#27272A` / `#3F3F46` | Dividers, control borders |
| `brand` | `#2563EB` | `#3B82F6` | Primary buttons, links, selected, focus |
| `brand-hover` / `deep` / `soft` / `border` | `#1D4ED8` / `#1E3A8A` / `#EFF6FF` / `#BFDBFE` | remapped | States and tints |
| `success` / `warning` / `error` | `#16A34A` / `#D97706` / `#DC2626` | lightened for contrast | Semantic text and icons |
| `*-soft` | `#F0FDF4` / `#FFFBEB` / `#FEF2F2` | dark tints | Badge and alert backgrounds |

Naming note: `text-primary` is the **text** color, not the brand color. The brand blue is `brand`. `accent`
is an alias of `brand` and is the one token merchants can override per storefront.

Rules:
- Brand blue never fills large areas. The only large blue surface is the marketing CTA panel, which uses the
  restrained `#2563EB → #1E3A8A` gradient.
- Semantic colors are small: an icon or badge plus a text label. Status is never conveyed by color alone.
- `subtle` (`#94A3B8`) fails AA on white for body-size text, so it is used only for placeholders and non-essential captions.
