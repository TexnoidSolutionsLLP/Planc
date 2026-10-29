"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button, Input, Label } from "@sellly/ui";
import { resetPasswordAction } from "@/lib/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Saving…" : "Save new password"}
    </Button>
  );
}

/** Reached from the reset email via /auth/callback, which signs the user in first. */
export default function ResetPasswordPage() {
  const [state, formAction] = useFormState(resetPasswordAction, undefined);

  return (
    <div>
      <h1 className="text-[22px] font-semibold tracking-tight text-primary">Choose a new password</h1>
      <p className="mb-6 mt-1 text-small text-muted">At least 8 characters.</p>
      <form action={formAction} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
          <Input id="password" name="password" type="password" autoComplete="new-password" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required />
        </div>
        {state?.error && <p className="text-small text-error">{state.error}</p>}
        <SubmitButton />
      </form>
    </div>
  );
}
