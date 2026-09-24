"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTenantDb, prisma, writeAuditLog } from "@sellly/database";
import { requireStore } from "@/lib/session";

const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.coerce.number().positive(),
  compareAtPrice: z.coerce.number().optional(),
  sku: z.string().optional(),
  inventoryQty: z.coerce.number().int().min(0).default(0),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).default("DRAFT"),
  tags: z.string().optional(),
  images: z.string().optional(),
});

function parseImages(raw?: string): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((u) => typeof u === "string") : [];
  } catch {
    return [];
  }
}

function slugify(input: string) {
  return input.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export type FormState = { error?: string } | undefined;

export async function createProductAction(storeSlug: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const { store, userId } = await requireStore(storeSlug);
  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const db = getTenantDb(store.id);
  const slug = slugify(parsed.data.name);
  const tags = parsed.data.tags ? parsed.data.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
  const images = parseImages(parsed.data.images);

  const product = await db.product.create({
    name: parsed.data.name,
    slug,
    description: parsed.data.description,
    price: parsed.data.price,
    compareAtPrice: parsed.data.compareAtPrice || null,
    sku: parsed.data.sku,
    inventoryQty: parsed.data.inventoryQty,
    status: parsed.data.status,
    tags,
    images: images.length ? { create: images.map((url, position) => ({ url, position })) } : undefined,
  } as any);

  await writeAuditLog({ storeId: store.id, userId, action: "product.created", entity: "product", entityId: product.id });

  revalidatePath(`/${storeSlug}/products`);
  redirect(`/${storeSlug}/products`);
}

export async function updateProductAction(storeSlug: string, productId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const { store, userId } = await requireStore(storeSlug);
  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const db = getTenantDb(store.id);
  const tags = parsed.data.tags ? parsed.data.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
  const images = parseImages(parsed.data.images);

  await db.product.update(productId, {
    name: parsed.data.name,
    description: parsed.data.description,
    price: parsed.data.price,
    compareAtPrice: parsed.data.compareAtPrice || null,
    sku: parsed.data.sku,
    inventoryQty: parsed.data.inventoryQty,
    status: parsed.data.status,
    tags,
  });

  // Replacing the image set is simpler and safer than diffing — product
  // images have no other relations that would be orphaned by a delete+recreate.
  await prisma.productImage.deleteMany({ where: { productId, product: { storeId: store.id } } });
  if (images.length) {
    await prisma.productImage.createMany({
      data: images.map((url, position) => ({ productId, url, position })),
    });
  }

  await writeAuditLog({ storeId: store.id, userId, action: "product.updated", entity: "product", entityId: productId });

  revalidatePath(`/${storeSlug}/products`);
  redirect(`/${storeSlug}/products`);
}

export async function deleteProductAction(storeSlug: string, productId: string) {
  const { store, userId } = await requireStore(storeSlug);
  const db = getTenantDb(store.id);
  await db.product.delete(productId);
  await writeAuditLog({ storeId: store.id, userId, action: "product.deleted", entity: "product", entityId: productId });
  revalidatePath(`/${storeSlug}/products`);
}

export async function bulkUpdateStatusAction(storeSlug: string, productIds: string[], status: "ACTIVE" | "DRAFT" | "ARCHIVED") {
  const { store, userId } = await requireStore(storeSlug);
  const db = getTenantDb(store.id);
  await Promise.all(productIds.map((id) => db.product.update(id, { status })));
  await writeAuditLog({ storeId: store.id, userId, action: "product.bulk_status", metadata: { productIds, status } });
  revalidatePath(`/${storeSlug}/products`);
}
