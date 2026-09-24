"use client";

import { useState, useTransition } from "react";
import { GripVertical, Eye, EyeOff } from "lucide-react";
import { Button, Card, Input, Label, Textarea } from "@sellly/ui";
import { SECTION_LABELS, type ThemeConfig, type ThemeSection } from "@sellly/theme";
import { updateThemeConfigAction } from "@/lib/actions/theme";

export function ThemeEditor({
  storeSlug,
  initialConfig,
  previewUrl,
  defaultAccent,
}: {
  storeSlug: string;
  initialConfig: ThemeConfig;
  previewUrl: string;
  defaultAccent: string;
}) {
  const [sections, setSections] = useState<ThemeSection[]>(initialConfig.sections);
  const [accent, setAccent] = useState(initialConfig.colors?.accent ?? defaultAccent);
  const [selectedId, setSelectedId] = useState<string | null>(sections[0]?.id ?? null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [previewKey, setPreviewKey] = useState(0);

  const selected = sections.find((s) => s.id === selectedId);

  function toggleVisible(id: string) {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s)));
  }

  function updateContent(id: string, key: string, value: string) {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, content: { ...s.content, [key]: value } } : s)));
  }

  function handleDrop(targetId: string) {
    if (!dragId || dragId === targetId) return;
    setSections((prev) => {
      const next = [...prev];
      const fromIndex = next.findIndex((s) => s.id === dragId);
      const toIndex = next.findIndex((s) => s.id === targetId);
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
    setDragId(null);
  }

  function handleSave() {
    startTransition(async () => {
      await updateThemeConfigAction(storeSlug, { sections, colors: { accent } });
      setSavedAt(Date.now());
      setPreviewKey((k) => k + 1);
    });
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr_300px]">
      <Card className="p-4">
        <p className="mb-3 text-small font-medium text-primary">Sections</p>
        <ul className="space-y-1">
          {sections.map((section) => (
            <li
              key={section.id}
              draggable
              onDragStart={() => setDragId(section.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(section.id)}
              onClick={() => setSelectedId(section.id)}
              className={`flex cursor-pointer items-center gap-2 rounded-sm border px-2 py-2 text-small ${
                selectedId === section.id ? "border-brand bg-secondary" : "border-border"
              }`}
            >
              <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted" />
              <span className="flex-1 truncate">{SECTION_LABELS[section.type]}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleVisible(section.id);
                }}
                aria-label={section.visible ? "Hide section" : "Show section"}
                className="text-muted hover:text-primary"
              >
                {section.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-caption text-muted">Drag to reorder. Click the eye to show or hide a section.</p>
      </Card>

      <Card className="flex flex-col p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <span className="text-caption text-muted">Preview</span>
          <Button size="sm" onClick={handleSave} disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </Button>
        </div>
        <div className="flex-1 bg-secondary/40 p-2">
          <iframe
            key={previewKey}
            src={previewUrl}
            title="Storefront preview"
            className="h-[720px] w-full rounded-sm border border-border bg-surface"
          />
        </div>
        {savedAt && <p className="border-t border-border px-4 py-2 text-caption text-success">Saved. Preview refreshed.</p>}
      </Card>

      <Card className="p-4">
        <p className="mb-3 text-small font-medium text-primary">
          {selected ? SECTION_LABELS[selected.type] : "Colors"}
        </p>

        {selected && (
          <div className="space-y-3">
            {selected.type === "hero" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="hero-title">Headline</Label>
                  <Input id="hero-title" value={selected.content?.title ?? ""} onChange={(e) => updateContent(selected.id, "title", e.target.value)} placeholder="Store name (default)" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="hero-cta">Button label</Label>
                  <Input id="hero-cta" value={selected.content?.ctaLabel ?? ""} onChange={(e) => updateContent(selected.id, "ctaLabel", e.target.value)} placeholder="Shop now" />
                </div>
              </>
            )}
            {selected.type === "announcement_bar" && (
              <div className="space-y-1.5">
                <Label htmlFor="ann-text">Text</Label>
                <Input id="ann-text" value={selected.content?.text ?? ""} onChange={(e) => updateContent(selected.id, "text", e.target.value)} placeholder="Free shipping over ₹999" />
              </div>
            )}
            {selected.type === "product_grid" && (
              <div className="space-y-1.5">
                <Label htmlFor="grid-title">Section title</Label>
                <Input id="grid-title" value={selected.content?.title ?? ""} onChange={(e) => updateContent(selected.id, "title", e.target.value)} placeholder="New arrivals" />
              </div>
            )}
            {selected.type === "banner" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="banner-text">Headline</Label>
                  <Input id="banner-text" value={selected.content?.text ?? ""} onChange={(e) => updateContent(selected.id, "text", e.target.value)} placeholder="Festive sale — up to 30% off" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="banner-cta">Subtext</Label>
                  <Input id="banner-cta" value={selected.content?.ctaLabel ?? ""} onChange={(e) => updateContent(selected.id, "ctaLabel", e.target.value)} placeholder="Ends Sunday" />
                </div>
              </>
            )}
            {selected.type === "testimonials" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="quote">Quote</Label>
                  <Textarea id="quote" value={selected.content?.quote ?? ""} onChange={(e) => updateContent(selected.id, "quote", e.target.value)} placeholder="Loved the quality and quick delivery!" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="author">Attribution</Label>
                  <Input id="author" value={selected.content?.author ?? ""} onChange={(e) => updateContent(selected.id, "author", e.target.value)} placeholder="Ananya, Bengaluru" />
                </div>
              </>
            )}
            {selected.type === "faq" && (
              <div className="space-y-1.5">
                <Label htmlFor="faq-body">Questions (one per line, "question | answer")</Label>
                <Textarea
                  id="faq-body"
                  rows={6}
                  value={selected.content?.body ?? ""}
                  onChange={(e) => updateContent(selected.id, "body", e.target.value)}
                  placeholder={"How long does delivery take? | 3-5 business days\nDo you accept returns? | Yes, within 7 days"}
                />
              </div>
            )}
            {selected.type === "featured_collection" && (
              <p className="text-small text-muted">Shows your first collection automatically — add one under Collections.</p>
            )}
            {selected.type === "newsletter" && <p className="text-small text-muted">No settings for this section yet.</p>}
          </div>
        )}

        <div className="mt-6 border-t border-border pt-4">
          <Label htmlFor="accent">Accent color</Label>
          <div className="mt-1.5 flex items-center gap-2">
            <input id="accent" type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="h-9 w-9 cursor-pointer rounded-sm border border-border" />
            <Input value={accent} onChange={(e) => setAccent(e.target.value)} className="flex-1" />
          </div>
        </div>
      </Card>
    </div>
  );
}
