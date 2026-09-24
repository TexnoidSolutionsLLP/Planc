"use client";

import { useState, useTransition } from "react";
import { Button, Input, Label, Textarea } from "@sellly/ui";
import { TemplateGallery } from "@/components/template-gallery";
import {
  createStoreAction,
  addFirstProductAction,
  setThemeAction,
  enableCodAction,
  publishStoreAction,
} from "@/lib/actions/onboarding";

const STEPS = ["Store name", "Category", "First product", "Theme", "Payments", "Publish"] as const;
const CATEGORIES = ["Fashion & Apparel", "Jewelry & Accessories", "Beauty", "Home & Living", "Food & Bakery", "Other"];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [storeId, setStoreId] = useState<string | null>(null);
  const [storeSlug, setStoreSlug] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productDesc, setProductDesc] = useState("");
  const [theme, setTheme] = useState("minimal");

  function next() {
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function skip() {
    next();
  }

  function handleNameContinue() {
    if (!name.trim()) return setError("Give your store a name");
    setError(null);
    next();
  }

  function handleCreateStore() {
    startTransition(async () => {
      try {
        const { storeId, slug } = await createStoreAction(name, category);
        setStoreId(storeId);
        setStoreSlug(slug);
        next();
      } catch {
        setError("Something went wrong. Try again.");
      }
    });
  }

  function handleAddProduct(skipStep: boolean) {
    if (!storeId) return;
    if (skipStep) return next();
    if (!productName.trim() || !productPrice) return setError("Add a name and price, or skip this step");
    startTransition(async () => {
      await addFirstProductAction(storeId, { name: productName, price: Number(productPrice), description: productDesc });
      next();
    });
  }

  function handleTheme() {
    if (!storeId) return;
    startTransition(async () => {
      await setThemeAction(storeId, theme);
      next();
    });
  }

  function handlePayments(skipStep: boolean) {
    if (!storeId) return;
    startTransition(async () => {
      if (!skipStep) await enableCodAction(storeId);
      next();
    });
  }

  function handlePublish() {
    if (!storeId) return;
    startTransition(async () => {
      await publishStoreAction(storeId);
    });
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-16">
      <div className="mb-8">
        <div className="mb-2 flex justify-between text-caption text-muted">
          <span>
            Step {step + 1} of {STEPS.length}
          </span>
          <span>{STEPS[step]}</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-secondary">
          <div
            className="h-1.5 rounded-full bg-accent transition-all"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="rounded-md border border-border bg-surface p-8">
        {step === 0 && (
          <div className="space-y-4">
            <h1 className="text-h3 text-primary">What&apos;s your store called?</h1>
            <p className="text-body text-muted">You can change this any time.</p>
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Aria Jewelry"
            />
            {error && <p className="text-small text-error">{error}</p>}
            <Button className="w-full" onClick={handleNameContinue}>
              Continue
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h1 className="text-h3 text-primary">What do you sell?</h1>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`rounded-sm border px-3 py-2 text-left text-small ${
                    category === c ? "border-brand bg-secondary" : "border-border"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <Button className="w-full" onClick={handleCreateStore} disabled={pending}>
              {pending ? "Creating…" : "Continue"}
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h1 className="text-h3 text-primary">Add your first product</h1>
            <div className="space-y-1.5">
              <Label>Product name</Label>
              <Input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Aria Hoop Earrings" />
            </div>
            <div className="space-y-1.5">
              <Label>Price (₹)</Label>
              <Input type="number" value={productPrice} onChange={(e) => setProductPrice(e.target.value)} placeholder="899" />
            </div>
            <div className="space-y-1.5">
              <Label>Description (optional)</Label>
              <Textarea value={productDesc} onChange={(e) => setProductDesc(e.target.value)} placeholder="Tell customers about it" />
            </div>
            {error && <p className="text-small text-error">{error}</p>}
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => handleAddProduct(true)} disabled={pending}>
                Skip
              </Button>
              <Button className="flex-1" onClick={() => handleAddProduct(false)} disabled={pending}>
                {pending ? "Saving…" : "Continue"}
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h1 className="text-h3 text-primary">Choose a theme</h1>
            <p className="text-small text-muted">Pick a starting look for your store or portfolio. You can switch any time.</p>
            <div className="max-h-[420px] overflow-y-auto pr-1">
              <TemplateGallery compact value={theme} onSelect={(t) => setTheme(t.id)} />
            </div>
            <Button className="w-full" onClick={handleTheme} disabled={pending}>
              {pending ? "Saving…" : "Continue"}
            </Button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h1 className="text-h3 text-primary">Connect payments</h1>
            <p className="text-body text-muted">
              Start with Cash on Delivery — you can connect Razorpay for online payments any time from Settings → Payments.
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => handlePayments(true)} disabled={pending}>
                Skip
              </Button>
              <Button className="flex-1" onClick={() => handlePayments(false)} disabled={pending}>
                Enable Cash on Delivery
              </Button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4 text-center">
            <h1 className="text-h3 text-primary">You&apos;re ready to publish</h1>
            <p className="text-body text-muted">
              Your store {storeSlug ? <span className="font-medium text-primary">sellly.app/{storeSlug}</span> : ""} will go
              live. Share the link on Instagram or WhatsApp to start selling.
            </p>
            <Button className="w-full" onClick={handlePublish} disabled={pending}>
              {pending ? "Publishing…" : "Publish store"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
