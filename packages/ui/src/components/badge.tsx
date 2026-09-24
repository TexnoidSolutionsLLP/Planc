import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

const badgeVariants = cva("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-medium", {
  variants: {
    variant: {
      default: "bg-secondary text-muted",
      success: "bg-success-soft text-success",
      warning: "bg-warning-soft text-warning",
      error: "bg-error-soft text-error",
      accent: "bg-brand-soft text-brand",
    },
  },
  defaultVariants: { variant: "default" },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

/** Status is always conveyed by the text label, never color alone. */
export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
