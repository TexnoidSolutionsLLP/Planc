"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { Button, Input, Label } from "@sellly/ui";
import { signupAction } from "@/lib/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Creating account…" : "Create account"}
    </Button>
  );
}

export default function SignupPage() {
  const [state, formAction] = useFormState(signupAction, undefined);

  return (
    <div>
      <h1 className="text-[22px] font-semibold tracking-tight text-primary">Create your account</h1>
      <p className="mb-6 mt-1 text-small text-muted">Start selling from your social audience in about ten minutes.</p>
      <form action={formAction} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" name="name" placeholder="Priya Sharma" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="you@example.com" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" placeholder="At least 8 characters" required />
        </div>
        {state?.error && <p className="text-small text-error">{state.error}</p>}
        <SubmitButton />
      </form>
      <p className="mt-6 text-center text-small text-muted">
        Already have a store?{" "}
        <Link href="/login" className="font-medium text-brand hover:text-brand-hover">
          Log in
        </Link>
      </p>
    </div>
  );
}
