"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button, Card, Input, Label, Select, Textarea } from "@sellly/ui";
import type { FormState } from "@/lib/actions/products";
import { ImageUploader } from "../../_components/image-uploader";
import { AiProductAssistant } from "./ai-product-assistant";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  );
}

export function ProductForm({
  storeSlug,
  action,
  defaultValues,
  submitLabel = "Save product",
}: {
  storeSlug: string;
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  defaultValues?: {
    name?: string;
    description?: string;
    price?: number | string;
    compareAtPrice?: number | string;
    sku?: string;
    inventoryQty?: number;
    status?: string;
    tags?: string;
    images?: string[];
  };
  submitLabel?: string;
}) {
  const [state, formAction] = useFormState(action, undefined);
  const [images, setImages] = useState<string[]>(defaultValues?.images ?? []);
  const [name, setName] = useState(defaultValues?.name ?? "");
  const [description, setDescription] = useState(defaultValues?.description ?? "");
  const [price, setPrice] = useState(defaultValues?.price ?? "");
  const [tags, setTags] = useState(defaultValues?.tags ?? "");

  return (
    <Card>
      <form action={formAction} className="space-y-5">
        <div className="space-y-1.5">
          <Label>Images</Label>
          <ImageUploader storeSlug={storeSlug} value={images} onChange={setImages} />
          <input type="hidden" name="images" value={JSON.stringify(images)} />
        </div>

        {images[0] && (
          <AiProductAssistant
            storeSlug={storeSlug}
            imageUrl={images[0]}
            onApply={(result) => {
              setName(result.name);
              setDescription(result.description);
              setPrice(String(result.suggestedPrice));
              setTags(result.tags.join(", "));
            }}
          />
        )}

        <div className="space-y-1.5">
          <Label htmlFor="name">Product name</Label>
          <Input id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="price">Price (₹)</Label>
            <Input id="price" name="price" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="compareAtPrice">Compare-at price (₹)</Label>
            <Input id="compareAtPrice" name="compareAtPrice" type="number" step="0.01" defaultValue={defaultValues?.compareAtPrice} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="sku">SKU</Label>
            <Input id="sku" name="sku" defaultValue={defaultValues?.sku} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inventoryQty">Inventory</Label>
            <Input id="inventoryQty" name="inventoryQty" type="number" defaultValue={defaultValues?.inventoryQty ?? 0} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <Select id="status" name="status" defaultValue={defaultValues?.status ?? "DRAFT"}>
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input id="tags" name="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="new, bestseller" />
          </div>
        </div>

        {state?.error && <p className="text-small text-error">{state.error}</p>}
        <SubmitButton label={submitLabel} />
      </form>
    </Card>
  );
}
