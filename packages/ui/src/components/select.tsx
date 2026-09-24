import * as React from "react";
import { cn } from "../lib/cn";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded border border-border bg-surface px-3 text-[15px] text-primary transition-[border-color,box-shadow] duration-200 ease-premium focus-visible:border-brand focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand/[0.12] sm:h-10",
        className
      )}
      {...props}
    />
  )
);
Select.displayName = "Select";
