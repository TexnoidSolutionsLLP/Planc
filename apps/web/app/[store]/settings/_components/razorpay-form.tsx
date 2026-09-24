"use client";

import { useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button, Input, Label, useToast } from "@sellly/ui";
import { connectRazorpayAction } from "@/lib/actions/settings";

function SubmitButton({ connected }: { connected: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant="secondary" disabled={pending}>
      {pending ? "Connecting…" : connected ? "Update keys" : "Connect Razorpay"}
    </Button>
  );
}

export function RazorpayForm({ storeSlug, connected }: { storeSlug: string; connected: boolean }) {
  const action = connectRazorpayAction.bind(null, storeSlug);
  const [state, formAction] = useFormState(action, undefined);
  const { toast } = useToast();
  useEffect(() => {
    if (state?.success) toast({ title: "Razorpay connected" });
    if (state?.error) toast({ title: "Couldn't save", description: state.error, variant: "error" });
  }, [state, toast]);

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="publicKey">Key ID</Label>
          <Input id="publicKey" name="publicKey" placeholder="rzp_live_…" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="secretKey">Key Secret</Label>
          <Input id="secretKey" name="secretKey" type="password" placeholder="••••••••" required />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="webhookSecret">Webhook Secret</Label>
        <Input id="webhookSecret" name="webhookSecret" type="password" placeholder="Set when creating the webhook in Razorpay" required />
        <p className="text-caption text-muted">
          Create a webhook in your Razorpay dashboard pointing to this store&apos;s <code>/api/webhooks/razorpay</code> URL and
          paste the secret you set there.
        </p>
      </div>
      <SubmitButton connected={connected} />
    </form>
  );
}
