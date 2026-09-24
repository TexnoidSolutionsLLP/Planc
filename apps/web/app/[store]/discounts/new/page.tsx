"use client";

import { useParams } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { Button, Card, Input, Label, Select } from "@sellly/ui";
import { createDiscountAction } from "@/lib/actions/discounts";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Creating…" : "Create discount"}
    </Button>
  );
}

export default function NewDiscountPage() {
  const { store } = useParams<{ store: string }>();
  const action = createDiscountAction.bind(null, store);
  const [state, formAction] = useFormState(action, undefined);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-title text-primary">Create discount</h1>
        <p className="text-body text-muted">Give customers a reason to buy now.</p>
      </div>
      <Card>
        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required placeholder="Festive Sale" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="code">Code</Label>
            <Input id="code" name="code" required placeholder="FESTIVE20" className="uppercase" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="type">Type</Label>
              <Select id="type" name="type">
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED_AMOUNT">Fixed amount</option>
                <option value="FREE_SHIPPING">Free shipping</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="value">Value</Label>
              <Input id="value" name="value" type="number" required placeholder="20" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="minOrderValue">Minimum order value (₹)</Label>
              <Input id="minOrderValue" name="minOrderValue" type="number" placeholder="Optional" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="usageLimit">Usage limit</Label>
              <Input id="usageLimit" name="usageLimit" type="number" placeholder="Optional" />
            </div>
          </div>
          {state?.error && <p className="text-small text-error">{state.error}</p>}
          <SubmitButton />
        </form>
      </Card>
    </div>
  );
}
