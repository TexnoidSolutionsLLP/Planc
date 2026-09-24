"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTenantDb, writeAuditLog } from "@sellly/database";
import { requireStore } from "@/lib/session";

const schema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
});

function slugify(input: string) {
  return input.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export type FormState = { error?: string } | undefined;

export async function createCollectionAction(storeSlug: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const { store, userId } = await requireStore(storeSlug);
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const db = getTenantDb(store.id);
  const collection = await db.collection.create({
    name: parsed.data.name,
    slug: slugify(parsed.data.name),
    description: parsed.data.description,
    imageUrl: parsed.data.imageUrl || null,
  });

  await writeAuditLog({ storeId: store.id, userId, action: "collection.created", entity: "collection", entityId: collection.id });

  revalidatePath(`/${storeSlug}/collections`);
  redirect(`/${storeSlug}/collections`);
}
