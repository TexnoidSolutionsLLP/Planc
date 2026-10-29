"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { Button, Input, Label } from "@sellly/ui";
import { forgotPasswordAction } from "@/lib/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Sending…" : "Send reset link"}
    </Button>
  );
}

export default function ForgotPasswordPage() {
  const [state, formAction] = useFormState(forgotPasswordAction, undefined);

  return (
    <div>
      <h1 className="text-[22px] font-semibold tracking-tight text-primary">Reset your password</h1>
      <p className="mb-6 mt-1 text-small text-muted">We&apos;ll email you a link to choose a new password.</p>
      {state?.message ? (
        <p className="text-body text-primary">{state.message}</p>
      ) : (
        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="you@example.com" required />
          </div>
          {state?.error && <p className="text-small text-error">{state.error}</p>}
          <SubmitButton />
        </form>
      )}
      <p className="mt-6 text-center text-small text-muted">
        <Link href="/login" className="font-medium text-brand hover:text-brand-hover">
          Back to log in
        </Link>
      </p>
    </div>
  );
}
