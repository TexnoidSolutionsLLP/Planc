"use client";

import * as React from "react";
import { cn } from "../lib/cn";

export const menuItemClassName =
  "flex w-full items-center gap-2.5 rounded-[6px] px-2.5 py-2 text-left text-[14px] text-muted transition-colors duration-150 hover:bg-secondary hover:text-primary focus-visible:bg-secondary focus-visible:outline-none [&>svg]:h-4 [&>svg]:w-4";

interface DropdownMenuProps {
  trigger: React.ReactNode;
  label: string;
  align?: "left" | "right";
  triggerClassName?: string;
  panelClassName?: string;
  children: React.ReactNode;
}

export function DropdownMenu({ trigger, label, align = "right", triggerClassName, panelClassName, children }: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex items-center rounded transition-colors duration-150 focus-visible:ring-[3px] focus-visible:ring-brand/25 focus-visible:outline-none",
          triggerClassName
        )}
      >
        {trigger}
      </button>
      {open && (
        // Closing is deferred one tick so a submit button inside the panel still fires its form.
        <div
          role="menu"
          onClick={() => window.setTimeout(() => setOpen(false), 0)}
          className={cn(
            "absolute z-50 mt-2 min-w-[220px] animate-menu-in rounded-md border border-border bg-surface p-1 shadow-md",
            align === "right" ? "right-0 origin-top-right" : "left-0 origin-top-left",
            panelClassName
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function MenuLabel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-2.5 py-2 text-caption text-subtle", className)} {...props} />;
}

export function MenuSeparator() {
  return <div role="separator" className="my-1 h-px bg-border" />;
}
