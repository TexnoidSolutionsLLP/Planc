import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border border-border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2  ",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-brand text-white shadow hover:bg-brand/80   ",
        secondary:
          "border-transparent bg-secondary text-primary hover:bg-secondary/80   ",
        destructive:
          "border-transparent bg-error text-white shadow hover:bg-error/80   ",
        outline: "text-primary ",
        success: "border-success/20 bg-success-soft text-success",
        warning: "border-warning/20 bg-warning-soft text-warning",
        error: "border-error/20 bg-error-soft text-error",
        accent: "border-brand-border bg-brand-soft text-brand",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
