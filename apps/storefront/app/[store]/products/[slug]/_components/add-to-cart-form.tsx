"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@sellly/ui";
import { useCart } from "@/lib/cart-context";
import { trackClientEvent } from "@/lib/actions/analytics";

export function AddToCartForm({
  productId,
  name,
  price,
  imageUrl,
  inventoryQty,
  options,
}: {
  productId: string;
  name: string;
  price: number;
  imageUrl?: string;
  inventoryQty: number;
  options: { name: string; values: string[] }[];
}) {
  const { addItem } = useCart();
  const router = useRouter();
  const { store } = useParams<{ store: string }>();
  const [quantity, setQuantity] = useState(1);
  const [selected, setSelected] = useState<Record<string, string>>(
    Object.fromEntries(options.map((o) => [o.name, o.values[0]]))
  );

  const outOfStock = inventoryQty <= 0;
  const variantTitle = Object.values(selected).join(" / ") || undefined;

  function handleAdd() {
    addItem({ productId, name, price, imageUrl, variantTitle }, quantity);
    void trackClientEvent(store, "add_to_cart", { productId, quantity });
  }

  function handleBuyNow() {
    addItem({ productId, name, price, imageUrl, variantTitle }, quantity);
    void trackClientEvent(store, "add_to_cart", { productId, quantity });
    router.push(`/${store}/checkout`);
  }

  return (
    <div className="space-y-4">
      {options.map((opt) => (
        <div key={opt.name}>
          <p className="mb-1.5 text-small font-medium text-primary">{opt.name}</p>
          <div className="flex flex-wrap gap-2">
            {opt.values.map((v) => (
              <button
                key={v}
                onClick={() => setSelected((s) => ({ ...s, [opt.name]: v }))}
                className={`rounded-sm border px-3 py-1.5 text-small ${
                  selected[opt.name] === v ? "border-brand bg-secondary" : "border-border"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div>
        <p className="mb-1.5 text-small font-medium text-primary">Quantity</p>
        <div className="inline-flex items-center rounded-sm border border-border">
          <button className="px-3 py-2" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">
            −
          </button>
          <span className="w-8 text-center text-small">{quantity}</span>
          <button className="px-3 py-2" onClick={() => setQuantity((q) => q + 1)} aria-label="Increase quantity">
            +
          </button>
        </div>
      </div>

      {outOfStock ? (
        <Button className="w-full" disabled>
          Out of stock
        </Button>
      ) : (
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={handleAdd}>
            Add to cart
          </Button>
          <Button className="flex-1" onClick={handleBuyNow}>
            Buy now
          </Button>
        </div>
      )}
    </div>
  );
}
