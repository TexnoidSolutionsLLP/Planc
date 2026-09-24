export type SectionType =
  | "announcement_bar"
  | "hero"
  | "featured_collection"
  | "product_grid"
  | "banner"
  | "testimonials"
  | "faq"
  | "newsletter";

export interface ThemeSection {
  id: string;
  type: SectionType;
  visible: boolean;
  content?: Record<string, string>;
}

export interface ThemeConfig {
  sections: ThemeSection[];
  colors?: { accent?: string };
}

export const SECTION_LABELS: Record<SectionType, string> = {
  announcement_bar: "Announcement bar",
  hero: "Hero",
  featured_collection: "Featured collection",
  product_grid: "Product grid",
  banner: "Promotional banner",
  testimonials: "Testimonials",
  faq: "FAQ",
  newsletter: "Newsletter",
};

/**
 * Every store gets this section order when a theme is first activated.
 * Header/footer aren't in here — they're structural, not reorderable
 * sections (see docs/design/19-storefront.md).
 */
export const DEFAULT_SECTIONS: ThemeSection[] = [
  { id: "announcement_bar", type: "announcement_bar", visible: false, content: { text: "" } },
  { id: "hero", type: "hero", visible: true, content: {} },
  { id: "featured_collection", type: "featured_collection", visible: true, content: {} },
  { id: "product_grid", type: "product_grid", visible: true, content: { title: "New arrivals" } },
  { id: "banner", type: "banner", visible: false, content: { text: "", ctaLabel: "" } },
  { id: "testimonials", type: "testimonials", visible: false, content: {} },
  { id: "faq", type: "faq", visible: false, content: {} },
  { id: "newsletter", type: "newsletter", visible: true, content: {} },
];

/** Backfills any section types added after a store's theme was created, so
 * older stores don't lose new sections silently. */
export function normalizeThemeConfig(config: unknown): ThemeConfig {
  const parsed = config as ThemeConfig | undefined;
  const stored = parsed?.sections;
  if (!Array.isArray(stored) || stored.length === 0) return { sections: DEFAULT_SECTIONS, colors: parsed?.colors };

  const knownIds = new Set(stored.map((s) => s.id));
  const missing = DEFAULT_SECTIONS.filter((s) => !knownIds.has(s.id));
  return { sections: [...stored, ...missing], colors: parsed?.colors };
}

export * from "./templates";
import { getTemplate } from "./templates";

/** Starting sections for a freshly activated template, using its own copy. */
export function templateSections(idOrName?: string | null): ThemeSection[] {
  const t = getTemplate(idOrName);
  return DEFAULT_SECTIONS.map((s) => {
    if (s.type === "hero") return { ...s, content: { ...s.content, ctaLabel: t.labels.heroCta } };
    if (s.type === "product_grid") return { ...s, content: { ...s.content, title: t.labels.gridTitle } };
    return s;
  });
}
