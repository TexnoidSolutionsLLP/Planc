"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { Button, Input, Label } from "@sellly/ui";
import { loginAction } from "@/lib/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Logging in…" : "Log in"}
    </Button>
  );
}

export function LoginForm({ notice }: { notice?: string }) {
  const [state, formAction] = useFormState(loginAction, undefined);

  return (
    <div>
      <h1 className="text-[22px] font-semibold tracking-tight text-primary">Welcome back</h1>
      <p className="mb-6 mt-1 text-small text-muted">Log in to manage your store.</p>
      <form action={formAction} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="you@example.com" required />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-caption font-medium text-brand hover:text-brand-hover">
              Forgot password?
            </Link>
          </div>
          <Input id="password" name="password" type="password" placeholder="••••••••" required />
        </div>
        {notice && !state?.error && <p className="text-small text-warning">{notice}</p>}
        {state?.error && <p className="text-small text-error">{state.error}</p>}
        <SubmitButton />
      </form>
      <p className="mt-6 text-center text-small text-muted">
        New to Sellly?{" "}
        <Link href="/signup" className="font-medium text-brand hover:text-brand-hover">
          Create a store
        </Link>
      </p>
      {process.env.NODE_ENV !== "production" && <p className="mt-3 rounded bg-background px-3 py-2 text-center text-caption text-muted">Demo: demo@sellly.app / password123</p>}
    </div>
  );
}
