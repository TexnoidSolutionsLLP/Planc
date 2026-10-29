"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button, Card, Input, Label } from "@sellly/ui";
import { loginAction } from "@/lib/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Signing in…" : "Sign in"}
    </Button>
  );
}

export function LoginForm({ notice }: { notice?: string }) {
  const [state, formAction] = useFormState(loginAction, undefined);
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm items-center px-4">
      <Card className="w-full">
        <h1 className="text-[20px] font-semibold tracking-tight text-primary">Platform admin</h1>
        <p className="mt-1 text-small text-muted">Sign in with a Sellly staff account. Staff accounts are created by the platform team, not by sign-up.</p>
        <form action={formAction} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="username" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          {notice && !state?.error && <p className="text-small text-warning">{notice}</p>}
          {state?.error && <p className="text-small text-error">{state.error}</p>}
          <SubmitButton />
        </form>
      </Card>
    </div>
  );
}
