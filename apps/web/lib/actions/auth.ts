"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@sellly/database";
import { sendPasswordReset, signInWithPassword, signOut, signUpMerchant, updatePassword } from "@sellly/auth";
import { checkRateLimit } from "@sellly/rate-limit";
import { appOrigin } from "@/lib/app-url";

function clientIp() {
  return headers().get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

const signupSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Enter a valid email"),
  phone: z
    .string()
    .trim()
    .max(20)
    .regex(/^[0-9+\-\s()]*$/, "Enter a valid phone number")
    .optional()
    .or(z.literal("")),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type FormState = { error?: string; message?: string } | undefined;

export async function signupAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const limit = checkRateLimit(`signup:${clientIp()}`, 5, 60 * 60 * 1000);
  if (!limit.allowed) return { error: "Too many attempts. Try again in a while." };

  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") ?? undefined,
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { name, email, phone, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing?.authId) return { error: "An account with this email already exists" };

  // Public sign-up only ever creates a merchant account: the profile row is
  // created on first sign-in with the default MERCHANT role (see getCurrentUser).
  const result = await signUpMerchant({
    email,
    password,
    name,
    phone: phone || undefined,
    emailRedirectTo: `${appOrigin()}/auth/callback?next=/onboarding`,
  });
  if (!result.ok) return { error: result.error };
  if (result.needsEmailConfirmation) {
    return { message: `We sent a confirmation link to ${email.toLowerCase()}. Open it to finish creating your account.` };
  }
  redirect("/onboarding");
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const limit = checkRateLimit(`login:${clientIp()}:${email.toLowerCase()}`, 10, 15 * 60 * 1000);
  if (!limit.allowed) return { error: "Too many login attempts. Try again in a few minutes." };

  const result = await signInWithPassword("web", email, password);
  if (!result.ok) return { error: result.error };
  redirect("/");
}

export async function forgotPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!z.string().email().safeParse(email).success) return { error: "Enter a valid email" };

  const limit = checkRateLimit(`reset:${clientIp()}`, 5, 60 * 60 * 1000);
  if (!limit.allowed) return { error: "Too many attempts. Try again in a while." };

  await sendPasswordReset("web", email, `${appOrigin()}/auth/callback?next=/reset-password`);
  return { message: "If an account exists for that email, a reset link is on its way." };
}

export async function resetPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return { error: "Password must be at least 8 characters" };
  if (password !== formData.get("confirm")) return { error: "The two passwords don't match" };

  const result = await updatePassword("web", password);
  if (!result.ok) return { error: result.error };
  redirect("/");
}

export async function signOutAction() {
  await signOut("web");
  redirect("/");
}
