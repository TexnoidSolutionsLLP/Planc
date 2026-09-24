"use client";

import { Link2 } from "lucide-react";
import { Button, useToast } from "@sellly/ui";

export function CopyLinkButton({ url, label = "Copy store link" }: { url: string; label?: string }) {
  const { toast } = useToast();

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Store link copied", description: "Paste it in your Instagram bio or WhatsApp." });
    } catch {
      toast({ title: "Couldn't copy automatically", description: url, variant: "warning" });
    }
  }

  return (
    <Button type="button" variant="secondary" onClick={copy}>
      <Link2 className="h-4 w-4" /> {label}
    </Button>
  );
}
