"use client";

import { useTransition } from "react";
import { TemplateGallery } from "@/components/template-gallery";
import { switchThemeAction } from "@/lib/actions/theme";

export function ThemePicker({ storeSlug, activeTheme }: { storeSlug: string; activeTheme?: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <TemplateGallery
      value={activeTheme}
      disabled={pending}
      onSelect={(t) => startTransition(() => switchThemeAction(storeSlug, t.id))}
    />
  );
}
