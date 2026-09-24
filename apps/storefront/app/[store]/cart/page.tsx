"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Minus, Plus, X } from "lucide-react";
import { Button, EmptyState, buttonVariants } from "@sellly/ui";
import { useCart, lineKey } from "@/lib/cart-context";

export default function CartPage() {
  const { store } = useParams<{ store: string }>();
  const { lines, updateQuantity, removeItem, subtotal } = useCart();

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <EmptyState
          title="Your cart is empty"
          description="Browse the store and add something you love."
          action={
            <Link href={`/${store}`} className={buttonVariants({})}>
              Continue shopping
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-h1 text-primary">Your cart</h1>
      <ul className="divide-y divide-border border-y border-border">
        {lines.map((l) => {
          const key = lineKey(l);
          return (
            <li key={key} className="flex items-center gap-4 py-4">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-sm bg-secondary">
                {l.imageUrl && <img src={l.imageUrl} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="flex-1">
                <p className="font-medium text-primary">{l.name}</p>
                {l.variantTitle && <p className="text-caption text-muted">{l.variantTitle}</p>}
                <p className="mt-1 text-small text-muted">₹{l.price.toLocaleString("en-IN")}</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="rounded-sm border border-border p-1.5" onClick={() => updateQuantity(key, l.quantity - 1)}>
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-6 text-center text-small">{l.quantity}</span>
                <button className="rounded-sm border border-border p-1.5" onClick={() => updateQuantity(key, l.quantity + 1)}>
                  <Plus className="h-3 w-3" />
                </button>
              </div>
              <p className="w-20 text-right font-medium text-primary">₹{(l.price * l.quantity).toLocaleString("en-IN")}</p>
              <button aria-label="Remove item" onClick={() => removeItem(key)} className="text-muted hover:text-error">
                <X className="h-4 w-4" />
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 flex items-center justify-between">
        <span className="text-body text-muted">Subtotal</span>
        <span className="text-h3 text-primary">₹{subtotal.toLocaleString("en-IN")}</span>
      </div>

      <Link href={`/${store}/checkout`}>
        <Button className="mt-6 w-full">Proceed to checkout</Button>
      </Link>
    </div>
  );
}
