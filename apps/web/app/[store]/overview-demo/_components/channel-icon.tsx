import { Instagram, Link2, MessageCircle } from "lucide-react";
import { cn } from "@sellly/ui";
import type { Channel } from "../_lib/sample-data";

const ICONS = { instagram: Instagram, whatsapp: MessageCircle, direct: Link2 };
const TONES = {
  instagram: "bg-brand-soft text-brand",
  whatsapp: "bg-success-soft text-success",
  direct: "bg-warning-soft text-warning",
};

export function ChannelIcon({ channel, className }: { channel: Channel; className?: string }) {
  const Icon = ICONS[channel];
  return (
    <span className={cn("inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full", TONES[channel], className)} aria-hidden="true">
      <Icon className="h-3.5 w-3.5" />
    </span>
  );
}
