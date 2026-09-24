"use client";

import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@sellly/ui";
import { generateProductCopyAction } from "@/lib/actions/ai";
import type { ProductAssistantResult } from "@sellly/ai";

export function AiProductAssistant({
  storeSlug,
  imageUrl,
  onApply,
}: {
  storeSlug: string;
  imageUrl: string;
  onApply: (result: ProductAssistantResult) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<ProductAssistantResult | null>(null);

  function handleGenerate() {
    setError(null);
    setDraft(null);
    startTransition(async () => {
      const result = await generateProductCopyAction(storeSlug, imageUrl);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setDraft(result.data);
    });
  }

  return (
    <div className="rounded-sm border border-accent/30 bg-accent/5 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-small font-medium text-primary">
          <Sparkles className="h-4 w-4 text-accent" />
          AI Product Assistant
        </div>
        <Button type="button" size="sm" variant="secondary" onClick={handleGenerate} disabled={pending}>
          {pending ? "Analyzing photo…" : "Generate from photo"}
        </Button>
      </div>

      {error && <p className="mt-2 text-small text-error">{error}</p>}

      {draft && (
        <div className="mt-3 space-y-2 rounded-sm bg-surface p-3 text-small">
          <p><span className="font-medium text-primary">Name:</span> {draft.name}</p>
          <p><span className="font-medium text-primary">Description:</span> {draft.description}</p>
          <p><span className="font-medium text-primary">Suggested price:</span> ₹{draft.suggestedPrice}</p>
          <p><span className="font-medium text-primary">Tags:</span> {draft.tags.join(", ")}</p>
          <p className="text-caption text-muted">Instagram caption: {draft.instagramCaption}</p>
          <Button type="button" size="sm" onClick={() => onApply(draft)}>
            Apply to product
          </Button>
        </div>
      )}
    </div>
  );
}
