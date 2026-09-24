"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { TEMPLATES, TEMPLATE_CATEGORY_LABELS, type TemplateCategory, type TemplateDef } from "@sellly/theme";
import { cn } from "@sellly/ui";

/** A tiny wireframe of the template built from its real colors and layout choices. */
export function TemplatePreview({ t }: { t: TemplateDef }) {
  const c = t.colors;
  const r = Math.min(t.radius, 10) / 2;
  const bar = (w: string, h = 3, color = c.text, extra?: React.CSSProperties) => (
    <span style={{ display: "block", width: w, height: h, background: color, borderRadius: 2, ...extra }} />
  );
  const cols = t.card.style === "list" ? 1 : t.card.columns === 2 ? 2 : 3;

  const header =
    t.header === "stacked" ? (
      <div className="flex flex-col items-center gap-1 py-1.5" style={{ borderBottom: `1px solid ${c.border}` }}>
        {bar("28%", 4)}
        <div className="flex gap-1.5">{bar("8px", 2, c.textMuted)}{bar("8px", 2, c.textMuted)}{bar("8px", 2, c.textMuted)}</div>
      </div>
    ) : (
      <div
        className={cn("flex items-center px-2 py-2", t.header === "center" ? "justify-between" : "gap-2")}
        style={{ borderBottom: `1px solid ${c.border}` }}
      >
        {t.header === "center" && <div className="flex gap-1">{bar("8px", 2, c.textMuted)}{bar("8px", 2, c.textMuted)}</div>}
        {bar("22%", 4)}
        <div className={cn("flex gap-1", t.header === "left" && "ml-auto")}>{bar("8px", 2, c.textMuted)}{bar("8px", 2, c.textMuted)}</div>
      </div>
    );

  const button = <span style={{ display: "block", width: 22, height: 6, background: c.accent, borderRadius: r }} />;

  const hero = {
    centered: (
      <div className="flex flex-1 flex-col items-center justify-center gap-1.5" style={{ background: c.surface2 }}>
        {bar("50%", 5)}{bar("34%", 2, c.textMuted)}{button}
      </div>
    ),
    split: (
      <div className="flex flex-1 items-center gap-2 px-2" style={{ background: c.surface2 }}>
        <div className="flex flex-1 flex-col gap-1.5">{bar("90%", 5)}{bar("60%", 2, c.textMuted)}{button}</div>
        <span className="h-[80%] w-[40%]" style={{ background: c.border, borderRadius: r * 1.5 }} />
      </div>
    ),
    fullbleed: (
      <div className="flex flex-1 flex-col items-center justify-end gap-1.5 pb-2" style={{ background: c.text }}>
        {bar("46%", 5, c.background)}{button}
      </div>
    ),
    statement: (
      <div className="flex flex-1 flex-col justify-center gap-1.5 px-2.5" style={{ borderBottom: `1px solid ${c.border}` }}>
        {bar("85%", 6)}{bar("55%", 6)}{button}
      </div>
    ),
    index: (
      <div className="flex flex-1 flex-col justify-center gap-1.5 px-2.5">
        {bar("8px", 3, c.accent, { borderRadius: 99 })}{bar("75%", 6)}{bar("40%", 2, c.textMuted)}
      </div>
    ),
  }[t.hero];

  const cards =
    t.card.style === "list" ? (
      <div className="flex flex-col px-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center justify-between py-1" style={{ borderBottom: `1px solid ${c.border}` }}>
            {bar(`${55 - i * 10}%`, 4)}
            {bar("6px", 2, c.textMuted)}
          </div>
        ))}
      </div>
    ) : (
      <div className="grid gap-1.5 p-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <div
            key={i}
            style={{
              background: t.card.style === "boxed" ? c.surface : "transparent",
              border: t.card.style === "boxed" ? `1px solid ${c.border}` : undefined,
              borderRadius: r,
              padding: t.card.style === "boxed" ? 2 : 0,
            }}
          >
            <span
              className="block"
              style={{
                height: t.card.aspect === "portrait" || (t.card.layout === "masonry" && i % 2 === 0) ? 26 : 20,
                background: t.card.style === "overlay" ? c.text : c.surface2,
                borderRadius: r,
                opacity: t.card.style === "overlay" ? 0.85 : 1,
              }}
            />
            {t.card.style !== "overlay" && <span className="mt-1 block">{bar("60%", 2)}</span>}
          </div>
        ))}
      </div>
    );

  return (
    <div
      className="flex aspect-[4/3] flex-col overflow-hidden rounded-md border"
      style={{ background: c.background, borderColor: c.border }}
      aria-hidden="true"
    >
      {header}
      {hero}
      {cards}
    </div>
  );
}

const CATEGORIES: (TemplateCategory | "all")[] = ["all", "ecommerce", "portfolio"];

export function TemplateGallery({
  value,
  onSelect,
  disabled,
  compact,
}: {
  value?: string;
  onSelect: (t: TemplateDef) => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  const [category, setCategory] = React.useState<TemplateCategory | "all">("all");
  const list = TEMPLATES.filter((t) => category === "all" || t.category === category);
  const active = value?.toLowerCase();

  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="Template type" className="inline-flex rounded-lg border border-border bg-secondary/60 p-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            role="tab"
            aria-selected={category === cat}
            onClick={() => setCategory(cat)}
            className={cn(
              "h-8 rounded-md px-3 text-[13px] font-medium transition-colors",
              category === cat ? "bg-surface text-primary shadow-sm" : "text-muted hover:text-primary"
            )}
          >
            {cat === "all" ? `All (${TEMPLATES.length})` : TEMPLATE_CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      <div className={cn("grid gap-4", compact ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4")}>
        {list.map((t) => {
          const selected = active === t.id || active === t.name.toLowerCase();
          return (
            <button
              key={t.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(t)}
              aria-pressed={selected}
              className={cn(
                "group rounded-lg border p-2 text-left transition-[border-color,box-shadow] duration-200 disabled:opacity-60",
                selected ? "border-brand ring-[3px] ring-brand/[0.12]" : "border-border hover:border-border-strong hover:shadow-sm"
              )}
            >
              <div className="relative">
                <TemplatePreview t={t} />
                {selected && (
                  <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                )}
              </div>
              <div className="px-1 pb-1 pt-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[14px] font-semibold text-primary">{t.name}</span>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted">
                    {TEMPLATE_CATEGORY_LABELS[t.category]}
                  </span>
                </div>
                {!compact && <p className="mt-0.5 text-small text-muted">{t.tagline}</p>}
                <p className="mt-0.5 text-caption text-subtle">{t.bestFor}</p>
                <div className="mt-2 flex gap-1" aria-hidden="true">
                  {[t.colors.background, t.colors.text, t.colors.accent].map((col, i) => (
                    <span key={i} className="h-3.5 w-3.5 rounded-full border border-border" style={{ background: col }} />
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
