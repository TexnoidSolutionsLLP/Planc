"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "../lib/cn";

type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastInput {
  title: string;
  description?: string;
  variant?: ToastVariant;
  action?: { label: string; onClick: () => void };
}

interface ToastItem extends ToastInput {
  id: number;
}

const ToastContext = React.createContext<{ toast: (input: ToastInput) => void } | null>(null);

const ICONS = {
  success: { Icon: CheckCircle2, className: "text-success" },
  error: { Icon: XCircle, className: "text-error" },
  warning: { Icon: AlertTriangle, className: "text-warning" },
  info: { Icon: Info, className: "text-brand" },
} as const;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);
  const nextId = React.useRef(0);

  const dismiss = React.useCallback((id: number) => setItems((prev) => prev.filter((t) => t.id !== id)), []);

  const toast = React.useCallback(
    (input: ToastInput) => {
      const id = nextId.current++;
      setItems((prev) => [...prev.slice(-2), { ...input, id }]);
      window.setTimeout(() => dismiss(id), input.variant === "error" ? 7000 : 4500);
    },
    [dismiss]
  );

  const value = React.useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(380px,calc(100vw-32px))] flex-col gap-2"
      >
        {items.map((t) => {
          const { Icon, className } = ICONS[t.variant ?? "success"];
          return (
            <div
              key={t.id}
              role="status"
              className="pointer-events-auto flex animate-toast-in items-start gap-3 rounded-[12px] border border-border bg-surface p-4 shadow-md"
            >
              <Icon className={cn("mt-0.5 h-[18px] w-[18px] shrink-0", className)} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-primary">{t.title}</p>
                {t.description && <p className="mt-0.5 text-small text-muted">{t.description}</p>}
                {t.action && (
                  <button
                    type="button"
                    onClick={t.action.onClick}
                    className="mt-2 text-small font-semibold text-brand hover:text-brand-hover"
                  >
                    {t.action.label}
                  </button>
                )}
              </div>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => dismiss(t.id)}
                className="rounded p-1 text-subtle transition-colors hover:bg-secondary hover:text-primary focus-visible:ring-[3px] focus-visible:ring-brand/25"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

const noop = { toast: () => {} };

export function useToast() {
  return React.useContext(ToastContext) ?? noop;
}
