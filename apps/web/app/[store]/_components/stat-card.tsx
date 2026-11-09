import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";
import { Card, cn } from "@sellly/ui";

/** Percentage change vs the previous period. `null` means there's nothing to compare against yet. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

/** Props for a StatCard's comparison line; omitted entirely when both periods are empty. */
export function comparison(current: number, previous: number, days: number) {
  if (current === 0 && previous === 0) return {};
  return { change: percentChange(current, previous), hint: `vs previous ${days} days` };
}

const TONE_CHIP = {
  brand: "bg-brand-soft text-brand",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  violet: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
};
const TONE_GLOW = {
  brand: "bg-brand/15",
  success: "bg-success/15",
  warning: "bg-warning/15",
  violet: "bg-violet-500/15",
};

export function StatCard({
  label,
  value,
  change,
  hint,
  icon: Icon,
  tone = "brand",
}: {
  icon?: LucideIcon;
  tone?: "brand" | "success" | "warning" | "violet";
  label: string;
  value: string;
  change?: number | null;
  hint?: string;
}) {
  const showChange = change !== undefined;
  const direction = change == null || change === 0 ? "flat" : change > 0 ? "up" : "down";

  return (
    <Card className="relative overflow-hidden p-5 sm:p-5">
      <div aria-hidden="true" className={cn("pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full blur-2xl", TONE_GLOW[tone])} />
      <div className="flex items-center justify-between">
        <p className="text-small text-muted">{label}</p>
        {Icon && (
          <span className={cn("flex h-8 w-8 items-center justify-center rounded-md", TONE_CHIP[tone])}>
            <Icon className="h-4 w-4" strokeWidth={2} />
          </span>
        )}
      </div>
      <p className="tabular mt-2 text-[30px] font-semibold leading-none tracking-tight text-primary">{value}</p>
      <div className="mt-3 flex items-center gap-2 text-small">
        {showChange &&
          (change === null ? (
            <span className="rounded-full bg-brand-soft px-2 py-0.5 text-caption text-brand">New</span>
          ) : (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 font-medium",
                direction === "up" && "text-success",
                direction === "down" && "text-error",
                direction === "flat" && "text-muted"
              )}
            >
              {direction === "up" && <ArrowUpRight className="h-3.5 w-3.5" aria-label="Up" />}
              {direction === "down" && <ArrowDownRight className="h-3.5 w-3.5" aria-label="Down" />}
              {direction === "flat" && <Minus className="h-3.5 w-3.5" aria-label="No change" />}
              {Math.abs(change).toFixed(1)}%
            </span>
          ))}
        {hint && <span className="text-muted">{hint}</span>}
      </div>
    </Card>
  );
}
