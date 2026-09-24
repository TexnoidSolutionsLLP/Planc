"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@sellly/database";
import { hashPassword, signIn, signOut } from "@sellly/auth";
import { checkRateLimit } from "@sellly/rate-limit";

function clientIp() {
  return headers().get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type FormState = { error?: string } | undefined;

export async function signupAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const limit = checkRateLimit(`signup:${clientIp()}`, 5, 60 * 60 * 1000);
  if (!limit.allowed) return { error: "Too many attempts. Try again in a while." };

  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { name, email, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) return { error: "An account with this email already exists" };

  await prisma.user.create({
    data: { name, email: email.toLowerCase(), passwordHash: hashPassword(password) },
  });

  await signIn("credentials", { email, password, redirectTo: "/onboarding" });
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const limit = checkRateLimit(`login:${clientIp()}:${email?.toLowerCase()}`, 10, 15 * 60 * 1000);
  if (!limit.allowed) return { error: "Too many login attempts. Try again in a few minutes." };

  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
  } catch (err: any) {
    if (err?.type === "CredentialsSignin") return { error: "Invalid email or password" };
    throw err;
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
