import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@sellly/ui";

/** Compact change indicator: "▲ +12.4%" in success, "▼ −3.1%" in error. */
export function Delta({ value, suffix = "%", className }: { value: number; suffix?: string; className?: string }) {
  const up = value >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn("tabular inline-flex items-center gap-0.5 text-caption font-semibold", up ? "text-success" : "text-error", className)}>
      <Icon className="h-3.5 w-3.5" aria-label={up ? "Up" : "Down"} />
      {up ? "+" : "−"}
      {Math.abs(value).toFixed(1)}
      {suffix}
    </span>
  );
}
