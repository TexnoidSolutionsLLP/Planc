# Typography

Typeface: **Inter** (loaded in `packages/ui/styles/globals.css`), falling back to `system-ui, -apple-system,
BlinkMacSystemFont, "Segoe UI", sans-serif`. Stylistic sets `cv11` and `ss01` are enabled; numeric columns use
the `.tabular` utility.

| Token | Size | Line height | Weight | Tracking | Use |
|---|---|---|---|---|---|
| `display` | 40 → 64px (fluid) | 1.05 | 600 | -0.04em | Marketing headline only |
| `h1` | 32 → 48px (fluid) | 1.1 | 600 | -0.035em | Storefront and marketing page titles |
| `h2` | 26 → 36px (fluid) | 1.15 | 600 | -0.025em | Section titles |
| `h3` | 24px | 1.25 | 600 | -0.015em | Sub-sections |
| `title` | 26px | 1.2 | 600 | -0.025em | Dashboard page titles |
| `body-lg` | 18px | 1.6 | 400 | — | Marketing lead paragraphs |
| `body` | 15px | 1.55 | 400 | — | Default text |
| `small` | 13px | 1.4 | 400 | — | Table cells, hints |
| `caption` | 12px | 1.4 | 500 | — | Badges, labels |

Fluid sizes use `clamp()` so type scales down on phones without a separate breakpoint. The dashboard uses the
compact `title` scale because a 48px H1 overwhelms a working screen; the H1 scale is for storefront and marketing.

Uppercase is reserved for the small blue eyebrow above marketing headlines. Copy is short and confident:
"Turn conversations into revenue.", not "Revolutionize your business with our powerful platform."
