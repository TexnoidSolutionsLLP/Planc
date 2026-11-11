"use server";

import { redirect } from "next/navigation";
import { prisma, type Prisma } from "@sellly/database";
import { getTemplate, templateSections } from "@sellly/theme";
import { isReservedStoreSlug, slugifyStoreName, storeAddress } from "@sellly/domains";
import { requireUser } from "@/lib/session";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** A store's slug is its subdomain, so it must be DNS-safe and not one of our own names (admin, app, www...). */
function storeSlugBase(name: string) {
  const slug = slugifyStoreName(name);
  if (!slug) return "my-store";
  return isReservedStoreSlug(slug) ? `${slug}-store` : slug;
}

function isCode(err: unknown, code: string) {
  return (err as { code?: string } | null)?.code === code;
}

/**
 * Runs a write that is scoped to a store the caller belongs to. The membership
 * check lives in the update's `where`, so ownership and the write are a single
 * query instead of a lookup followed by an update. No matching row (not a
 * member, or no such store) means Forbidden.
 */
async function updateOwnStore(storeId: string, data: Prisma.StoreUpdateInput) {
  const { userId } = await requireUser();
  try {
    await prisma.store.update({ where: { id: storeId, members: { some: { userId } } }, data });
  } catch (err) {
    if (isCode(err, "P2025")) throw new Error("Forbidden");
    throw err;
  }
}

/** Onboarding actions take a storeId from the client, so check the caller belongs to that store. */
async function requireOwnStore(storeId: string) {
  const { userId } = await requireUser();
  const membership = await prisma.storeMember.findUnique({ where: { storeId_userId: { storeId, userId } } });
  if (!membership) throw new Error("Forbidden");
  return userId;
}

/**
 * Tries `base`, `base-2`, `base-3`... until the write succeeds. The database's
 * unique constraint is the check, so a taken slug costs one failed insert
 * instead of a lookup query per candidate on every attempt.
 */
async function withUniqueSlug<T>(base: string, attempt: (slug: string) => Promise<T>): Promise<T> {
  const root = base || "store";
  for (let n = 1; n <= 8; n++) {
    try {
      return await attempt(n === 1 ? root : `${root}-${n}`);
    } catch (err) {
      if (!isCode(err, "P2002")) throw err;
    }
  }
  return attempt(`${root}-${Math.random().toString(36).slice(2, 7)}`);
}

export async function createStoreAction(name: string, category: string) {
  const { userId } = await requireUser();

  const store = await withUniqueSlug(storeSlugBase(name), (slug) =>
    prisma.store.create({
      data: {
        name,
        slug,
        category,
        status: "DRAFT",
        onboardingStep: "product",
        members: { create: { userId, role: "OWNER" } },
        storeSettings: { create: { codEnabled: true } },
        subscription: { create: { plan: "FREE" } },
        domains: { create: { hostname: slug, isSubdomain: true, isPrimary: true, status: "VERIFIED" } },
      },
    }),
  );

  return { storeId: store.id, slug: store.slug, address: storeAddress(store.slug) };
}

export async function addFirstProductAction(storeId: string, data: { name: string; price: number; description?: string }) {
  await withUniqueSlug(slugify(data.name), (slug) =>
    updateOwnStore(storeId, {
      onboardingStep: "theme",
      products: {
        create: { name: data.name, slug, description: data.description, price: data.price, status: "ACTIVE", inventoryQty: 10 },
      },
    }),
  );
}

export async function setThemeAction(storeId: string, themeName: string) {
  const template = getTemplate(themeName);
  await updateOwnStore(storeId, {
    onboardingStep: "payment",
    themes: {
      create: {
        name: template.name,
        baseTheme: template.id,
        config: { sections: templateSections(template.id) } as any,
        isActive: true,
      },
    },
  });
}

export async function enableCodAction(storeId: string) {
  await updateOwnStore(storeId, {
    onboardingStep: "publish",
    storeSettings: { update: { codEnabled: true } },
  });
}

export async function publishStoreAction(storeId: string) {
  await requireOwnStore(storeId);
  const current = await prisma.store.findUniqueOrThrow({ where: { id: storeId } });
  if (current.status === "SUSPENDED") throw new Error("This store is suspended. Contact Sellly support.");
  const store = await prisma.store.update({
    where: { id: storeId },
    data: { status: "PUBLISHED", publishedAt: new Date(), onboardingStep: null },
  });
  redirect(`/${store.slug}/overview?published=1`);
}
