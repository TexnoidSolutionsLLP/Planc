"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button, Card, Input, Label, Textarea } from "@sellly/ui";
import { createCollectionAction } from "@/lib/actions/collections";
import { useParams } from "next/navigation";
import { ImageUploader } from "../../_components/image-uploader";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Create collection"}
    </Button>
  );
}

export default function NewCollectionPage() {
  const { store } = useParams<{ store: string }>();
  const action = createCollectionAction.bind(null, store);
  const [state, formAction] = useFormState(action, undefined);
  const [images, setImages] = useState<string[]>([]);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-title text-primary">Add collection</h1>
        <p className="text-body text-muted">Group products so customers can browse by category.</p>
      </div>
      <Card>
        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Image</Label>
            <ImageUploader storeSlug={store} value={images} onChange={setImages} max={1} />
            <input type="hidden" name="imageUrl" value={images[0] ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required placeholder="Best Sellers" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" placeholder="Our most loved pieces" />
          </div>
          {state?.error && <p className="text-small text-error">{state.error}</p>}
          <SubmitButton />
        </form>
      </Card>
    </div>
  );
}
