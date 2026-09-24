"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTenantDb } from "@sellly/database";
import { requireStore } from "@/lib/session";

const schema = z.object({
  title: z.string().min(1),
  type: z.enum(["PERCENTAGE", "FIXED_AMOUNT", "FREE_SHIPPING"]),
  value: z.coerce.number().min(0),
  code: z.string().min(3).toUpperCase(),
  minOrderValue: z.coerce.number().optional(),
  usageLimit: z.coerce.number().int().optional(),
});

export type FormState = { error?: string } | undefined;

export async function createDiscountAction(storeSlug: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const { store } = await requireStore(storeSlug);
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const db = getTenantDb(store.id);
  await db.discount.create({
    title: parsed.data.title,
    type: parsed.data.type,
    value: parsed.data.value,
    minOrderValue: parsed.data.minOrderValue || null,
    usageLimit: parsed.data.usageLimit || null,
    codes: { create: [{ code: parsed.data.code }] },
  });

  revalidatePath(`/${storeSlug}/discounts`);
  redirect(`/${storeSlug}/discounts`);
}
