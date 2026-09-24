"use client";

import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { Button, Card, Textarea } from "@sellly/ui";
import { generateStoreBuilderDraftAction, applyStoreBuilderDraftAction } from "@/lib/actions/ai";
import type { StoreBuilderResult } from "@sellly/ai";

export function AiStoreBuilder({ storeSlug }: { storeSlug: string }) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [pending, startTransition] = useTransition();
  const [applying, startApplyTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<StoreBuilderResult | null>(null);
  const [applied, setApplied] = useState(false);

  function handleGenerate() {
    setError(null);
    setDraft(null);
    startTransition(async () => {
      const result = await generateStoreBuilderDraftAction(storeSlug, description);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setDraft(result.data);
    });
  }

  function handleApply() {
    if (!draft) return;
    startApplyTransition(async () => {
      await applyStoreBuilderDraftAction(storeSlug, draft);
      setApplied(true);
    });
  }

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Sparkles className="mr-2 h-4 w-4" /> AI Store Builder
      </Button>
    );
  }

  return (
    <Card>
      <div className="mb-3 flex items-center gap-2 text-h3 text-primary">
        <Sparkles className="h-4 w-4 text-accent" /> AI Store Builder
      </div>
      <p className="mb-3 text-small text-muted">
        Describe your business and desired aesthetic. We'll draft a homepage headline, collections and a theme
        recommendation — nothing is applied until you approve it.
      </p>
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="I sell premium handmade jewelry in Hyderabad. I want a minimal luxury store."
        rows={3}
      />
      {error && <p className="mt-2 text-small text-error">{error}</p>}
      <Button className="mt-3" onClick={handleGenerate} disabled={pending}>
        {pending ? "Generating…" : "Generate draft"}
      </Button>

      {draft && (
        <div className="mt-4 space-y-3 rounded-sm border border-border bg-secondary/40 p-4 text-small">
          <p><span className="font-medium text-primary">Headline:</span> {draft.heroTitle}</p>
          <p><span className="font-medium text-primary">Subheading:</span> {draft.heroDescription}</p>
          <p><span className="font-medium text-primary">Button:</span> {draft.heroCtaLabel}</p>
          <p><span className="font-medium text-primary">Recommended theme:</span> {draft.themeRecommendation}</p>
          <div>
            <p className="font-medium text-primary">Suggested collections:</p>
            <ul className="ml-4 list-disc">
              {draft.collections.map((c) => (
                <li key={c.name}>
                  {c.name} — {c.description}
                </li>
              ))}
            </ul>
          </div>
          {applied ? (
            <p className="text-success">Applied — homepage headline and collections updated.</p>
          ) : (
            <Button onClick={handleApply} disabled={applying}>
              {applying ? "Applying…" : "Approve & apply"}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
