import * as React from "react";
import { cn } from "../lib/cn";

const fieldBase =
  "w-full rounded border border-border bg-surface px-3 text-[15px] text-primary placeholder:text-subtle transition-[border-color,box-shadow] duration-200 ease-premium focus-visible:border-brand focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand/[0.12] disabled:opacity-50";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(fieldBase, "flex h-11 sm:h-10", className)} {...props} />
  )
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(fieldBase, "flex min-h-[96px] py-2.5", className)} {...props} />
  )
);
Textarea.displayName = "Textarea";

export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label ref={ref} className={cn("text-[13px] font-medium text-primary", className)} {...props} />
  )
);
Label.displayName = "Label";
