export type TemplateCategory = "ecommerce" | "portfolio";
export type HeaderVariant = "left" | "center" | "stacked";
export type FooterVariant = "simple" | "columns" | "big";
export type HeroVariant = "centered" | "split" | "fullbleed" | "statement" | "index";
export type CardStyle = "plain" | "boxed" | "overlay" | "list";
export type CardAspect = "square" | "portrait" | "landscape";

export interface CardConfig {
  style: CardStyle;
  aspect: CardAspect;
  /** Desktop column count (mobile is always 2, or 1 for list). */
  columns: 2 | 3 | 4;
  /** "masonry" staggers card heights using CSS columns. */
  layout: "grid" | "masonry";
  /** Portfolio templates hide prices on cards; the product page still shows them. */
  showPrice: boolean;
}

export interface TemplateLabels {
  /** Nav link / search page label, e.g. "Shop" or "Work". */
  shop: string;
  gridTitle: string;
  heroCta: string;
  heroEyebrow?: string;
  newsletterTitle: string;
  newsletterBody: string;
  newsletterCta: string;
  /** Shown on cards/list rows in place of a price for portfolio templates. */
  viewLabel: string;
}

export interface TemplateDef {
  id: string;
  name: string;
  category: TemplateCategory;
  tagline: string;
  bestFor: string;
  /** Hex colors. Mapped onto the design-system CSS variables on the storefront. */
  colors: {
    background: string;
    surface: string;
    surface2: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    border: string;
    accent: string;
    onAccent: string;
  };
  fonts: {
    heading: string;
    body: string;
    /** Google Fonts families to load, with only weights each family supports. */
    load: { family: string; weights: number[] }[];
  };
  heading: { weight: number; tracking: string; uppercase?: boolean };
  /** Base corner radius in px; every rounded-* class on the storefront scales from it. */
  radius: number;
  uppercaseNav?: boolean;
  header: HeaderVariant;
  footer: FooterVariant;
  hero: HeroVariant;
  card: CardConfig;
  labels: TemplateLabels;
}

const shopLabels = (over: Partial<TemplateLabels> = {}): TemplateLabels => ({
  shop: "Shop",
  gridTitle: "New arrivals",
  heroCta: "Shop now",
  newsletterTitle: "Stay in the loop",
  newsletterBody: "Get updates on new drops and offers.",
  newsletterCta: "Subscribe",
  viewLabel: "View product",
  ...over,
});

const workLabels = (over: Partial<TemplateLabels> = {}): TemplateLabels => ({
  shop: "Work",
  gridTitle: "Selected work",
  heroCta: "View work",
  newsletterTitle: "Let's work together",
  newsletterBody: "Leave your email and I'll get back to you.",
  newsletterCta: "Send",
  viewLabel: "View project",
  ...over,
});

export const TEMPLATES: TemplateDef[] = [
  // ─────────────────────────── Online store ───────────────────────────
  {
    id: "minimal",
    name: "Minimal",
    category: "ecommerce",
    tagline: "Clean, quiet and product-first.",
    bestFor: "Any catalogue",
    colors: { background: "#FFFFFF", surface: "#FFFFFF", surface2: "#F5F5F4", text: "#0A0A0A", textSecondary: "#52525B", textMuted: "#A1A1AA", border: "#E7E5E4", accent: "#111111", onAccent: "#FFFFFF" },
    fonts: { heading: "Inter", body: "Inter", load: [{ family: "Inter", weights: [400, 500, 600] }] },
    heading: { weight: 500, tracking: "-0.03em" },
    radius: 2,
    header: "left",
    footer: "simple",
    hero: "centered",
    card: { style: "plain", aspect: "portrait", columns: 4, layout: "grid", showPrice: true },
    labels: shopLabels(),
  },
  {
    id: "modern",
    name: "Modern",
    category: "ecommerce",
    tagline: "Soft, rounded and friendly.",
    bestFor: "Gadgets, lifestyle, general stores",
    colors: { background: "#F8FAFC", surface: "#FFFFFF", surface2: "#EEF2F7", text: "#0F172A", textSecondary: "#475569", textMuted: "#94A3B8", border: "#E2E8F0", accent: "#2563EB", onAccent: "#FFFFFF" },
    fonts: { heading: "DM Sans", body: "DM Sans", load: [{ family: "DM Sans", weights: [400, 500, 600, 700] }] },
    heading: { weight: 700, tracking: "-0.035em" },
    radius: 14,
    header: "left",
    footer: "columns",
    hero: "split",
    card: { style: "boxed", aspect: "square", columns: 3, layout: "grid", showPrice: true },
    labels: shopLabels({ heroCta: "Explore the collection" }),
  },
  {
    id: "editorial",
    name: "Editorial",
    category: "ecommerce",
    tagline: "Magazine-style serif storytelling.",
    bestFor: "Fashion, books, curated goods",
    colors: { background: "#FAF7F2", surface: "#FFFDF9", surface2: "#F0EAE0", text: "#1C1917", textSecondary: "#57534E", textMuted: "#A8A29E", border: "#E5DDD0", accent: "#9A3412", onAccent: "#FFFFFF" },
    fonts: { heading: "Playfair Display", body: "Inter", load: [{ family: "Playfair Display", weights: [400, 500, 600, 700] }, { family: "Inter", weights: [400, 500, 600] }] },
    heading: { weight: 500, tracking: "-0.02em" },
    radius: 0,
    uppercaseNav: true,
    header: "stacked",
    footer: "columns",
    hero: "statement",
    card: { style: "plain", aspect: "portrait", columns: 3, layout: "grid", showPrice: true },
    labels: shopLabels({ heroCta: "Read the collection", gridTitle: "The latest edit" }),
  },
  {
    id: "luxury",
    name: "Luxury",
    category: "ecommerce",
    tagline: "Dark, refined, gold-accented.",
    bestFor: "Jewellery, watches, premium goods",
    colors: { background: "#0B0B0C", surface: "#131315", surface2: "#1A1A1D", text: "#F5F1E8", textSecondary: "#B5AFA1", textMuted: "#7A756A", border: "#2A2A2E", accent: "#C9A45C", onAccent: "#0B0B0C" },
    fonts: { heading: "Cormorant Garamond", body: "Inter", load: [{ family: "Cormorant Garamond", weights: [400, 500, 600, 700] }, { family: "Inter", weights: [400, 500, 600] }] },
    heading: { weight: 500, tracking: "0.01em" },
    radius: 0,
    uppercaseNav: true,
    header: "stacked",
    footer: "big",
    hero: "fullbleed",
    card: { style: "plain", aspect: "portrait", columns: 3, layout: "grid", showPrice: true },
    labels: shopLabels({ heroCta: "Discover", gridTitle: "The collection" }),
  },
  {
    id: "bold",
    name: "Bold",
    category: "ecommerce",
    tagline: "Loud colour, hard edges, big type.",
    bestFor: "Streetwear, gifts, young brands",
    colors: { background: "#FFF7D6", surface: "#FFFFFF", surface2: "#FFE873", text: "#0A0A0A", textSecondary: "#3F3F46", textMuted: "#71717A", border: "#0A0A0A", accent: "#FF4D2E", onAccent: "#FFFFFF" },
    fonts: { heading: "Space Grotesk", body: "Space Grotesk", load: [{ family: "Space Grotesk", weights: [400, 500, 600, 700] }] },
    heading: { weight: 700, tracking: "-0.045em", uppercase: true },
    radius: 0,
    header: "left",
    footer: "columns",
    hero: "statement",
    card: { style: "boxed", aspect: "square", columns: 3, layout: "grid", showPrice: true },
    labels: shopLabels({ heroCta: "Grab yours", gridTitle: "Fresh drops" }),
  },
  {
    id: "botanica",
    name: "Botanica",
    category: "ecommerce",
    tagline: "Calm greens and gentle curves.",
    bestFor: "Beauty, skincare, wellness",
    colors: { background: "#F6F4EE", surface: "#FFFDF8", surface2: "#ECE9DC", text: "#1F2A1F", textSecondary: "#55604F", textMuted: "#8A9483", border: "#DCD8C6", accent: "#4D6B4A", onAccent: "#FFFFFF" },
    fonts: { heading: "DM Serif Display", body: "DM Sans", load: [{ family: "DM Serif Display", weights: [400] }, { family: "DM Sans", weights: [400, 500, 600] }] },
    heading: { weight: 400, tracking: "-0.01em" },
    radius: 22,
    header: "center",
    footer: "columns",
    hero: "split",
    card: { style: "boxed", aspect: "portrait", columns: 3, layout: "grid", showPrice: true },
    labels: shopLabels({ heroCta: "Shop the ritual", gridTitle: "Best sellers" }),
  },
  {
    id: "street",
    name: "Street",
    category: "ecommerce",
    tagline: "High-contrast, full-bleed drops.",
    bestFor: "Fashion, sneakers, apparel",
    colors: { background: "#F4F4F2", surface: "#FFFFFF", surface2: "#E8E8E4", text: "#111111", textSecondary: "#52525B", textMuted: "#8A8A85", border: "#D9D9D3", accent: "#E11D2E", onAccent: "#FFFFFF" },
    fonts: { heading: "Archivo", body: "Archivo", load: [{ family: "Archivo", weights: [400, 500, 600, 800] }] },
    heading: { weight: 800, tracking: "-0.03em", uppercase: true },
    radius: 0,
    uppercaseNav: true,
    header: "left",
    footer: "big",
    hero: "fullbleed",
    card: { style: "overlay", aspect: "portrait", columns: 4, layout: "grid", showPrice: true },
    labels: shopLabels({ heroCta: "Shop the drop", gridTitle: "Latest drop" }),
  },
  {
    id: "hearth",
    name: "Hearth",
    category: "ecommerce",
    tagline: "Warm, earthy and homely.",
    bestFor: "Home decor, furniture, handmade",
    colors: { background: "#FBF6F0", surface: "#FFFCF8", surface2: "#F1E7DB", text: "#2B211A", textSecondary: "#6B5A4C", textMuted: "#A08F80", border: "#E6D8C8", accent: "#B4532A", onAccent: "#FFFFFF" },
    fonts: { heading: "Fraunces", body: "DM Sans", load: [{ family: "Fraunces", weights: [400, 500, 600, 700] }, { family: "DM Sans", weights: [400, 500, 600] }] },
    heading: { weight: 500, tracking: "-0.02em" },
    radius: 10,
    header: "center",
    footer: "columns",
    hero: "split",
    card: { style: "plain", aspect: "square", columns: 3, layout: "grid", showPrice: true },
    labels: shopLabels({ heroCta: "Furnish your home", gridTitle: "Made for living" }),
  },
  {
    id: "sweet",
    name: "Sweet",
    category: "ecommerce",
    tagline: "Playful, pink and rounded.",
    bestFor: "Bakery, food, gifting, kids",
    colors: { background: "#FFF5F7", surface: "#FFFFFF", surface2: "#FFE4EA", text: "#3B1A24", textSecondary: "#7A4B5A", textMuted: "#B08A97", border: "#F8D3DC", accent: "#DB2777", onAccent: "#FFFFFF" },
    fonts: { heading: "Bricolage Grotesque", body: "DM Sans", load: [{ family: "Bricolage Grotesque", weights: [500, 600, 700] }, { family: "DM Sans", weights: [400, 500, 600] }] },
    heading: { weight: 700, tracking: "-0.03em" },
    radius: 26,
    header: "center",
    footer: "simple",
    hero: "centered",
    card: { style: "boxed", aspect: "square", columns: 3, layout: "grid", showPrice: true },
    labels: shopLabels({ heroCta: "Order now", gridTitle: "Fresh from the kitchen" }),
  },
  {
    id: "volt",
    name: "Volt",
    category: "ecommerce",
    tagline: "Dark tech with a neon edge.",
    bestFor: "Electronics, gadgets, gaming",
    colors: { background: "#08090C", surface: "#101218", surface2: "#171A22", text: "#F4F6FA", textSecondary: "#A0A8B8", textMuted: "#6B7385", border: "#232735", accent: "#C6F432", onAccent: "#0A0A0A" },
    fonts: { heading: "Sora", body: "Sora", load: [{ family: "Sora", weights: [400, 500, 600, 700] }] },
    heading: { weight: 600, tracking: "-0.04em" },
    radius: 12,
    header: "left",
    footer: "columns",
    hero: "split",
    card: { style: "boxed", aspect: "square", columns: 4, layout: "grid", showPrice: true },
    labels: shopLabels({ heroCta: "Shop gear", gridTitle: "Trending now" }),
  },

  // ───────────────────────────── Portfolio ─────────────────────────────
  {
    id: "folio",
    name: "Folio",
    category: "portfolio",
    tagline: "Big type, generous whitespace.",
    bestFor: "Designers, illustrators, creatives",
    colors: { background: "#FAFAF9", surface: "#FFFFFF", surface2: "#F0EFEC", text: "#0C0A09", textSecondary: "#57534E", textMuted: "#A8A29E", border: "#E7E5E4", accent: "#FF5B2E", onAccent: "#FFFFFF" },
    fonts: { heading: "Syne", body: "Inter", load: [{ family: "Syne", weights: [500, 600, 700, 800] }, { family: "Inter", weights: [400, 500, 600] }] },
    heading: { weight: 700, tracking: "-0.04em" },
    radius: 0,
    header: "left",
    footer: "big",
    hero: "index",
    card: { style: "plain", aspect: "landscape", columns: 2, layout: "grid", showPrice: false },
    labels: workLabels({ heroEyebrow: "Portfolio" }),
  },
  {
    id: "lens",
    name: "Lens",
    category: "portfolio",
    tagline: "Immersive, image-led gallery.",
    bestFor: "Photographers, videographers",
    colors: { background: "#0A0A0A", surface: "#121212", surface2: "#1B1B1B", text: "#EDEDED", textSecondary: "#A3A3A3", textMuted: "#6B6B6B", border: "#262626", accent: "#FAFAFA", onAccent: "#0A0A0A" },
    fonts: { heading: "Cormorant Garamond", body: "Manrope", load: [{ family: "Cormorant Garamond", weights: [400, 500, 600, 700] }, { family: "Manrope", weights: [400, 500, 600] }] },
    heading: { weight: 500, tracking: "0em" },
    radius: 0,
    uppercaseNav: true,
    header: "center",
    footer: "simple",
    hero: "fullbleed",
    card: { style: "overlay", aspect: "portrait", columns: 3, layout: "masonry", showPrice: false },
    labels: workLabels({ gridTitle: "Gallery", heroCta: "Enter gallery", viewLabel: "View series", heroEyebrow: "Photography" }),
  },
  {
    id: "atelier",
    name: "Atelier",
    category: "portfolio",
    tagline: "Warm, gallery-wall masonry.",
    bestFor: "Artists, studios, makers selling art",
    colors: { background: "#F3EEE7", surface: "#FBF8F3", surface2: "#E9E1D6", text: "#26211C", textSecondary: "#6A5F55", textMuted: "#A69B90", border: "#DDD3C6", accent: "#7C4A2D", onAccent: "#FFFFFF" },
    fonts: { heading: "Instrument Serif", body: "Inter", load: [{ family: "Instrument Serif", weights: [400] }, { family: "Inter", weights: [400, 500, 600] }] },
    heading: { weight: 400, tracking: "-0.02em" },
    radius: 4,
    header: "stacked",
    footer: "columns",
    hero: "statement",
    card: { style: "plain", aspect: "portrait", columns: 3, layout: "masonry", showPrice: true },
    labels: workLabels({ gridTitle: "The collection", heroCta: "Browse works", viewLabel: "View piece", heroEyebrow: "Studio" }),
  },
  {
    id: "agency",
    name: "Agency",
    category: "portfolio",
    tagline: "An indexed list of projects.",
    bestFor: "Studios, agencies, consultants",
    colors: { background: "#FFFFFF", surface: "#FFFFFF", surface2: "#F4F4F5", text: "#0A0A0A", textSecondary: "#52525B", textMuted: "#A1A1AA", border: "#E4E4E7", accent: "#FF3D00", onAccent: "#FFFFFF" },
    fonts: { heading: "Manrope", body: "Manrope", load: [{ family: "Manrope", weights: [400, 500, 600, 800] }] },
    heading: { weight: 800, tracking: "-0.05em" },
    radius: 0,
    header: "left",
    footer: "big",
    hero: "statement",
    card: { style: "list", aspect: "landscape", columns: 2, layout: "grid", showPrice: false },
    labels: workLabels({ heroEyebrow: "Independent studio", gridTitle: "Index of work" }),
  },
  {
    id: "mono",
    name: "Mono",
    category: "portfolio",
    tagline: "Terminal-inspired and technical.",
    bestFor: "Developers, engineers, indie hackers",
    colors: { background: "#0D1117", surface: "#161B22", surface2: "#1C2230", text: "#E6EDF3", textSecondary: "#9DA7B3", textMuted: "#6E7681", border: "#30363D", accent: "#3FB950", onAccent: "#0D1117" },
    fonts: { heading: "JetBrains Mono", body: "Inter", load: [{ family: "JetBrains Mono", weights: [400, 500, 600, 700] }, { family: "Inter", weights: [400, 500, 600] }] },
    heading: { weight: 600, tracking: "-0.04em" },
    radius: 6,
    header: "left",
    footer: "simple",
    hero: "index",
    card: { style: "boxed", aspect: "landscape", columns: 3, layout: "grid", showPrice: false },
    labels: workLabels({ shop: "Projects", gridTitle: "Projects", heroEyebrow: "~/portfolio", heroCta: "See projects", newsletterTitle: "Get in touch", newsletterBody: "Open to new projects and collaborations." }),
  },
];

export const TEMPLATE_CATEGORY_LABELS: Record<TemplateCategory, string> = {
  ecommerce: "Online store",
  portfolio: "Portfolio",
};

export const DEFAULT_TEMPLATE_ID = "minimal";

/** Resolves a Theme row's `baseTheme` / `name` (legacy rows store "Minimal", "minimal", …). */
export function getTemplate(idOrName?: string | null): TemplateDef {
  const key = idOrName?.trim().toLowerCase();
  return TEMPLATES.find((t) => t.id === key || t.name.toLowerCase() === key) ?? TEMPLATES.find((t) => t.id === DEFAULT_TEMPLATE_ID)!;
}

function channels(hex: string): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n) || full.length !== 6) return "0 0 0";
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

export function templateFontsUrl(t: TemplateDef): string {
  const families = t.fonts.load
    .map((f) => `family=${encodeURIComponent(f.family).replace(/%20/g, "+")}:wght@${f.weights.join(";")}`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

/**
 * Storefront-only CSS. Colors override the design-system variables (so every
 * existing token class — bg-surface, text-muted, border-border, bg-accent —
 * re-skins automatically); radius and fonts are applied via a few scoped rules.
 * `accent` is the merchant's own override from the theme editor.
 */
export function templateCss(t: TemplateDef, accent?: string): string {
  const c = t.colors;
  const brand = accent && /^#[0-9a-f]{3,6}$/i.test(accent) ? accent : c.accent;
  const r = t.radius;
  const dark = channels(c.background).split(" ").map(Number).reduce((a, b) => a + b, 0) < 300;
  return `
:root{
  color-scheme:${dark ? "dark" : "light"};
  --color-background:${channels(c.background)};
  --color-surface:${channels(c.surface)};
  --color-surface-2:${channels(c.surface2)};
  --color-text:${channels(c.text)};
  --color-text-secondary:${channels(c.textSecondary)};
  --color-text-muted:${channels(c.textMuted)};
  --color-border:${channels(c.border)};
  --color-border-strong:${channels(c.textMuted)};
  --color-primary:${channels(brand)};
  --color-primary-hover:${channels(brand)};
  --color-primary-deep:${channels(brand)};
  --color-primary-soft:${channels(c.surface2)};
  --color-primary-border:${channels(c.border)};
  --sf-on-accent:${channels(c.onAccent)};
  --sf-radius:${r}px;
}
html,body{font-family:'${t.fonts.body}',system-ui,-apple-system,sans-serif}
h1,h2,h3,h4,.sf-heading{font-family:'${t.fonts.heading}',system-ui,sans-serif!important;font-weight:${t.heading.weight}!important;letter-spacing:${t.heading.tracking}!important;${t.heading.uppercase ? "text-transform:uppercase;" : ""}}
.rounded-sm{border-radius:${Math.round(r * 0.5)}px!important}
.rounded{border-radius:${r}px!important}
.rounded-md{border-radius:${Math.round(r * 1.4)}px!important}
.rounded-lg,.rounded-xl{border-radius:${Math.round(r * 1.8)}px!important}
.bg-accent.text-white,.bg-brand.text-white{color:rgb(var(--sf-on-accent))!important}
`.trim();
}
