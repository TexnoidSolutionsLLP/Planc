"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button, Input, Label } from "@sellly/ui";
import { addCustomDomainAction } from "@/lib/actions/domains";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Adding…" : "Add domain"}
    </Button>
  );
}

export function AddDomainForm({ storeSlug }: { storeSlug: string }) {
  const action = addCustomDomainAction.bind(null, storeSlug);
  const [state, formAction] = useFormState(action, undefined);

  return (
    <form action={formAction} className="space-y-2">
      <Label htmlFor="hostname">Domain</Label>
      <div className="flex gap-2">
        <Input id="hostname" name="hostname" placeholder="shop.example.com" required className="flex-1" />
        <SubmitButton />
      </div>
      {state?.error && <p className="text-small text-error">{state.error}</p>}
    </form>
  );
}
