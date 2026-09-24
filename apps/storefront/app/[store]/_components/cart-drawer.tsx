"use client";

import Link from "next/link";
import { X, Minus, Plus } from "lucide-react";
import { Button } from "@sellly/ui";
import { useCart, lineKey } from "@/lib/cart-context";

export function CartDrawer({ storeSlug }: { storeSlug: string }) {
  const { lines, isOpen, setOpen, updateQuantity, subtotal } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
      <div className="relative flex h-full w-full max-w-sm flex-col bg-surface shadow-xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-h3 text-primary">Your cart</h2>
          <button aria-label="Close cart" onClick={() => setOpen(false)}>
            <X className="h-5 w-5 text-muted" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {lines.length === 0 ? (
            <p className="text-small text-muted">Your cart is empty.</p>
          ) : (
            <ul className="space-y-4">
              {lines.map((l) => {
                const key = lineKey(l);
                return (
                  <li key={key} className="flex gap-3">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-sm bg-secondary">
                      {l.imageUrl && <img src={l.imageUrl} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-small font-medium text-primary">{l.name}</p>
                      {l.variantTitle && <p className="text-caption text-muted">{l.variantTitle}</p>}
                      <div className="mt-1 flex items-center gap-2">
                        <button
                          className="rounded-sm border border-border p-1"
                          onClick={() => updateQuantity(key, l.quantity - 1)}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-small">{l.quantity}</span>
                        <button
                          className="rounded-sm border border-border p-1"
                          onClick={() => updateQuantity(key, l.quantity + 1)}
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <p className="text-small text-primary">₹{(l.price * l.quantity).toLocaleString("en-IN")}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {lines.length > 0 && (
          <div className="border-t border-border p-4">
            <div className="mb-3 flex justify-between text-body font-medium text-primary">
              <span>Subtotal</span>
              <span>₹{subtotal.toLocaleString("en-IN")}</span>
            </div>
            <Link href={`/${storeSlug}/checkout`} onClick={() => setOpen(false)}>
              <Button className="w-full">Checkout</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
