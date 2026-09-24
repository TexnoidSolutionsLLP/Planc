"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Label } from "@sellly/ui";
import { useCart } from "@/lib/cart-context";
import { placeOrderAction, previewDiscountAction } from "@/lib/actions/checkout";
import { openRazorpayCheckout } from "@/lib/razorpay-checkout";

export function CheckoutForm({
  storeSlug,
  storeName,
  codEnabled,
  onlinePaymentEnabled,
}: {
  storeSlug: string;
  storeName: string;
  codEnabled: boolean;
  onlinePaymentEnabled: boolean;
}) {
  const { lines, subtotal, clear } = useCart();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "RAZORPAY">(onlinePaymentEnabled ? "RAZORPAY" : "COD");
  const [discountCode, setDiscountCode] = useState("");
  const [discountPending, startDiscountTransition] = useTransition();
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; amountOff: number; freeShipping: boolean } | null>(null);

  if (lines.length === 0) {
    return <p className="text-body text-muted">Your cart is empty. Add something before checking out.</p>;
  }

  function handleApplyDiscount() {
    setDiscountError(null);
    startDiscountTransition(async () => {
      const result = await previewDiscountAction(
        storeSlug,
        discountCode,
        subtotal,
        lines.map((l) => l.productId)
      );
      if ("error" in result) {
        setDiscountError(result.error);
        setAppliedDiscount(null);
        return;
      }
      setAppliedDiscount({ code: result.discount.code, amountOff: result.discount.amountOff, freeShipping: result.discount.freeShipping });
    });
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await placeOrderAction(storeSlug, {
        name: formData.get("name") as string,
        phone: formData.get("phone") as string,
        email: (formData.get("email") as string) || "",
        line1: formData.get("line1") as string,
        line2: (formData.get("line2") as string) || "",
        city: formData.get("city") as string,
        state: formData.get("state") as string,
        postalCode: formData.get("postalCode") as string,
        paymentMethod,
        discountCode: appliedDiscount?.code,
        lines: lines.map((l) => ({
          productId: l.productId,
          name: l.name,
          variantTitle: l.variantTitle,
          price: l.price,
          quantity: l.quantity,
          imageUrl: l.imageUrl,
        })),
      });

      if ("error" in result) {
        setError(result.error);
        return;
      }

      if (result.razorpay) {
        await openRazorpayCheckout({
          ...result.razorpay,
          storeName,
          customerName: formData.get("name") as string,
          customerEmail: (formData.get("email") as string) || undefined,
          customerPhone: formData.get("phone") as string,
        });
      }

      clear();
      router.push(`/${storeSlug}/order-confirmation/${result.orderId}`);
    });
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <Card>
        <h2 className="mb-4 text-h3 text-primary">Contact & shipping</h2>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" type="tel" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email (optional)</Label>
              <Input id="email" name="email" type="email" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="line1">Address</Label>
            <Input id="line1" name="line1" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="line2">Apartment, suite, etc. (optional)</Label>
            <Input id="line2" name="line2" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="state">State</Label>
              <Input id="state" name="state" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="postalCode">PIN code</Label>
              <Input id="postalCode" name="postalCode" required />
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-h3 text-primary">Payment</h2>
        <div className="space-y-2">
          {onlinePaymentEnabled && (
            <label className={`flex items-center gap-3 rounded-sm border p-3 text-small ${paymentMethod === "RAZORPAY" ? "border-brand bg-secondary" : "border-border"}`}>
              <input type="radio" checked={paymentMethod === "RAZORPAY"} onChange={() => setPaymentMethod("RAZORPAY")} />
              UPI / Card / Net Banking / Wallet
            </label>
          )}
          {codEnabled && (
            <label className={`flex items-center gap-3 rounded-sm border p-3 text-small ${paymentMethod === "COD" ? "border-brand bg-secondary" : "border-border"}`}>
              <input type="radio" checked={paymentMethod === "COD"} onChange={() => setPaymentMethod("COD")} />
              Cash on Delivery
            </label>
          )}
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-h3 text-primary">Discount code</h2>
        {appliedDiscount ? (
          <div className="flex items-center justify-between rounded-sm border border-success/30 bg-success/5 px-3 py-2 text-small text-success">
            <span>
              {appliedDiscount.code} applied {appliedDiscount.freeShipping ? "— free shipping" : `— -₹${appliedDiscount.amountOff}`}
            </span>
            <button
              type="button"
              className="text-caption underline"
              onClick={() => {
                setAppliedDiscount(null);
                setDiscountCode("");
              }}
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value)}
              placeholder="Enter code"
              className="uppercase"
            />
            <Button type="button" variant="secondary" onClick={handleApplyDiscount} disabled={discountPending || !discountCode}>
              {discountPending ? "Checking…" : "Apply"}
            </Button>
          </div>
        )}
        {discountError && <p className="mt-2 text-small text-error">{discountError}</p>}
      </Card>

      <div>
        <div className="flex items-center justify-between text-small text-muted">
          <span>Subtotal</span>
          <span>₹{subtotal.toLocaleString("en-IN")}</span>
        </div>
        {appliedDiscount && !appliedDiscount.freeShipping && (
          <div className="flex items-center justify-between text-small text-success">
            <span>Discount ({appliedDiscount.code})</span>
            <span>-₹{appliedDiscount.amountOff.toLocaleString("en-IN")}</span>
          </div>
        )}
        <div className="mt-1 flex items-center justify-between text-h3 text-primary">
          <span>Total</span>
          <span>₹{Math.max(0, subtotal - (appliedDiscount?.amountOff ?? 0)).toLocaleString("en-IN")}</span>
        </div>
        <p className="mt-1 text-caption text-muted">
          {appliedDiscount?.freeShipping ? "Free shipping applied. " : ""}Shipping is calculated after you place your order.
        </p>
      </div>

      {error && <p className="text-small text-error">{error}</p>}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Placing order…" : "Place order"}
      </Button>
    </form>
  );
}
