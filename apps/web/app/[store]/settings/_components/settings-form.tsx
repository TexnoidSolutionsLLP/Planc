"use client";

import { useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button, Input, Label, Textarea, useToast } from "@sellly/ui";
import { updateStoreSettingsAction } from "@/lib/actions/settings";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Saving…" : "Save"}
    </Button>
  );
}

export function SettingsForm({
  storeSlug,
  name,
  description,
  supportEmail,
  supportPhone,
}: {
  storeSlug: string;
  name: string;
  description: string;
  supportEmail: string;
  supportPhone: string;
}) {
  const action = updateStoreSettingsAction.bind(null, storeSlug);
  const [state, formAction] = useFormState(action, undefined);
  const { toast } = useToast();
  useEffect(() => {
    if (state?.success) toast({ title: "Store details saved" });
    if (state?.error) toast({ title: "Couldn't save", description: state.error, variant: "error" });
  }, [state, toast]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Store name</Label>
        <Input id="name" name="name" defaultValue={name} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" defaultValue={description} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="supportEmail">Support email</Label>
          <Input id="supportEmail" name="supportEmail" type="email" defaultValue={supportEmail} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="supportPhone">Support phone</Label>
          <Input id="supportPhone" name="supportPhone" defaultValue={supportPhone} />
        </div>
      </div>
      <SubmitButton />
    </form>
  );
}
