"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
  Sparkles,
  Store,
} from "lucide-react";
import { Button, Input, Label, ThemeToggle } from "@sellly/ui";
import { loginAction } from "@/lib/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      className="admin-login-submit w-full"
      disabled={pending}
    >
      {pending ? "Signing in…" : "Sign in to workspace"}
      <ArrowRight size={17} aria-hidden="true" />
    </Button>
  );
}

export function LoginForm({ notice }: { notice?: string }) {
  const [state, formAction] = useFormState(loginAction, undefined);
  const [showPassword, setShowPassword] = useState(false);
  const errorMessage = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (state?.error) errorMessage.current?.focus();
  }, [state?.error]);
  return (
    <div className="admin-login">
      <header className="admin-login-header">
        <Link href="/login" className="admin-brand" aria-label="Sellly admin">
          <span className="admin-brand-mark" aria-hidden="true">
            s<span />
          </span>
          <span>
            Sellly <small>Admin</small>
          </span>
        </Link>
        <ThemeToggle />
      </header>
      <main id="admin-main-content" tabIndex={-1} className="admin-login-grid">
        <section
          className="admin-login-story"
          aria-labelledby="admin-login-story-title"
        >
          <span className="login-workspace-label">
            <Sparkles size={15} aria-hidden="true" /> Your platform, beautifully
            together.
          </span>
          <h2 id="admin-login-story-title">
            Big ideas.
            <br />
            One workspace.
          </h2>
          <p>
            Look after your merchants, follow their progress and keep your
            platform moving.
          </p>
          <div className="login-orbit-scene" aria-hidden="true">
            <div className="promo-art">
              <span className="promo-orbit orbit-one" />
              <span className="promo-orbit orbit-two" />
              <span className="promo-orbit orbit-three" />
              <div className="promo-bag">
                <Store size={49} strokeWidth={1.2} aria-hidden="true" />
                <span>sellly</span>
              </div>
              <span className="promo-spark spark-one">✦</span>
              <span className="promo-spark spark-two">✦</span>
            </div>
          </div>
          <div className="login-access-note">
            <ShieldCheck size={20} aria-hidden="true" />
            <span>
              Thoughtful support.
              <small>Merchant data stays owner-approved.</small>
            </span>
          </div>
        </section>
        <section
          className="admin-login-form-panel"
          aria-labelledby="admin-login-title"
        >
          <span className="login-lock-icon">
            <KeyRound size={23} aria-hidden="true" />
          </span>
          <h1 id="admin-login-title">Welcome back</h1>
          <p>Sign in to your Sellly admin workspace.</p>
          <form action={formAction} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                placeholder="you@company.com…"
                spellCheck={false}
                aria-describedby={
                  state?.error ? "admin-login-error" : undefined
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="admin-password-field">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password…"
                  aria-describedby={
                    state?.error ? "admin-login-error" : undefined
                  }
                  required
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={18} aria-hidden="true" />
                  ) : (
                    <Eye size={18} aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
            {notice && !state?.error && (
              <p role="status" className="login-notice text-warning">
                {notice}
              </p>
            )}
            {state?.error && (
              <p
                ref={errorMessage}
                id="admin-login-error"
                tabIndex={-1}
                role="alert"
                className="login-notice text-error"
              >
                {state.error}
              </p>
            )}
            <SubmitButton />
          </form>
          <div className="login-staff-note">
            <ShieldCheck size={16} aria-hidden="true" />
            <p>
              For Sellly staff only. Your platform team creates your account and
              manages your access.
            </p>
          </div>
          {process.env.NODE_ENV === "development" && (
            <Link href="/demo" className="login-demo-link">
              Preview with sample data{" "}
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          )}
        </section>
      </main>
      <footer className="admin-login-footer">
        Sellly · Platform administration
      </footer>
    </div>
  );
}
