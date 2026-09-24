import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded text-[14px] font-semibold transition-[background-color,border-color,color,box-shadow] duration-200 ease-premium disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand/25",
  {
    variants: {
      variant: {
        primary: "bg-brand text-white hover:bg-brand-hover",
        secondary: "border border-border bg-surface text-primary hover:bg-background",
        ghost: "text-muted hover:bg-secondary hover:text-primary",
        destructive: "bg-error text-white hover:opacity-90",
        link: "h-auto px-0 text-brand hover:text-brand-hover",
      },
      size: {
        default: "h-11 px-4 sm:h-10",
        sm: "h-9 px-3 text-[13px] sm:h-8",
        lg: "h-12 px-6 text-[15px] sm:h-11",
        icon: "h-11 w-11 sm:h-10 sm:w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
);
Button.displayName = "Button";
