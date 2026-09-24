"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma, writeAuditLog } from "@sellly/database";
import { generateProductCopy, generateStoreBuilderDraft, isAiConfigured, type StoreBuilderResult } from "@sellly/ai";
import { checkRateLimit } from "@sellly/rate-limit";
import { requireStore } from "@/lib/session";

export type AiResult<T> = { error: string } | { data: T };

function slugify(input: string) {
  return input.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function generateProductCopyAction(storeSlug: string, imageUrl: string): Promise<AiResult<Awaited<ReturnType<typeof generateProductCopy>>>> {
  const { store, userId } = await requireStore(storeSlug);
  if (!isAiConfigured()) return { error: "AI features aren't configured for this deployment yet (ANTHROPIC_API_KEY missing)." };

  const limit = checkRateLimit(`ai-product:${store.id}`, 20, 60 * 60 * 1000);
  if (!limit.allowed) return { error: "You've hit the AI generation limit for this hour. Try again later." };

  try {
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) return { error: "Couldn't load that image" };
    const contentType = imageRes.headers.get("content-type") ?? "image/jpeg";
    const buffer = Buffer.from(await imageRes.arrayBuffer());
    const base64 = buffer.toString("base64");

    const data = await generateProductCopy(base64, contentType);
    await writeAuditLog({ storeId: store.id, userId, action: "ai.product_copy_generated" });
    return { data };
  } catch (err: any) {
    return { error: err.message ?? "AI generation failed" };
  }
}

const storeBuilderInput = z.string().min(10, "Describe your business in a bit more detail");

export async function generateStoreBuilderDraftAction(storeSlug: string, description: string): Promise<AiResult<StoreBuilderResult>> {
  const { store, userId } = await requireStore(storeSlug);
  if (!isAiConfigured()) return { error: "AI features aren't configured for this deployment yet (ANTHROPIC_API_KEY missing)." };

  const parsed = storeBuilderInput.safeParse(description);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const limit = checkRateLimit(`ai-store-builder:${store.id}`, 10, 60 * 60 * 1000);
  if (!limit.allowed) return { error: "You've hit the AI generation limit for this hour. Try again later." };

  try {
    const data = await generateStoreBuilderDraft(parsed.data);
    await writeAuditLog({ storeId: store.id, userId, action: "ai.store_builder_generated" });
    return { data };
  } catch (err: any) {
    return { error: err.message ?? "AI generation failed" };
  }
}

/** Only called when the merchant explicitly clicks Apply — nothing from the
 * AI draft touches the database before this. */
export async function applyStoreBuilderDraftAction(storeSlug: string, draft: StoreBuilderResult) {
  const { store, userId } = await requireStore(storeSlug);

  const theme = await prisma.theme.findFirst({ where: { storeId: store.id, isActive: true } });
  if (theme) {
    const config = theme.config as any;
    const sections = (config?.sections ?? []).map((s: any) =>
      s.type === "hero"
        ? { ...s, content: { ...s.content, title: draft.heroTitle, description: draft.heroDescription, ctaLabel: draft.heroCtaLabel } }
        : s
    );
    await prisma.theme.update({ where: { id: theme.id }, data: { config: { ...config, sections } } });
  }

  await prisma.store.update({
    where: { id: store.id },
    data: { description: draft.heroDescription },
  });

  for (const collection of draft.collections) {
    const slug = slugify(collection.name);
    const existing = await prisma.collection.findUnique({ where: { storeId_slug: { storeId: store.id, slug } } });
    if (!existing) {
      await prisma.collection.create({ data: { storeId: store.id, name: collection.name, description: collection.description, slug } });
    }
  }

  await writeAuditLog({ storeId: store.id, userId, action: "ai.store_builder_applied" });
  revalidatePath(`/${storeSlug}/online-store`);
  revalidatePath(`/${storeSlug}/collections`);
}
