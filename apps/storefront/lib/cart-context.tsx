"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export interface CartLine {
  productId: string;
  variantId?: string;
  name: string;
  variantTitle?: string;
  price: number;
  imageUrl?: string;
  quantity: number;
}

interface CartContextValue {
  lines: CartLine[];
  addItem: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clear: () => void;
  subtotal: number;
  count: number;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function lineKey(l: Pick<CartLine, "productId" | "variantId">) {
  return `${l.productId}:${l.variantId ?? "default"}`;
}

export function CartProvider({ storeSlug, children }: { storeSlug: string; children: React.ReactNode }) {
  const storageKey = `sellly_cart_${storeSlug}`;
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isOpen, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) setLines(JSON.parse(stored));
    } catch {
      // ignore corrupted local storage
    }
    setHydrated(true);
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(lines));
    } catch {
      // storage may be unavailable (private browsing) — cart just won't persist
    }
  }, [lines, storageKey, hydrated]);

  const value = useMemo<CartContextValue>(() => {
    const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
    const count = lines.reduce((sum, l) => sum + l.quantity, 0);

    return {
      lines,
      subtotal,
      count,
      isOpen,
      setOpen,
      addItem: (line, quantity = 1) => {
        setLines((prev) => {
          const key = lineKey(line);
          const existing = prev.find((l) => lineKey(l) === key);
          if (existing) {
            return prev.map((l) => (lineKey(l) === key ? { ...l, quantity: l.quantity + quantity } : l));
          }
          return [...prev, { ...line, quantity }];
        });
        setOpen(true);
      },
      updateQuantity: (key, quantity) => {
        setLines((prev) =>
          quantity <= 0 ? prev.filter((l) => lineKey(l) !== key) : prev.map((l) => (lineKey(l) === key ? { ...l, quantity } : l))
        );
      },
      removeItem: (key) => setLines((prev) => prev.filter((l) => lineKey(l) !== key)),
      clear: () => setLines([]),
    };
  }, [lines, isOpen]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export { lineKey };
