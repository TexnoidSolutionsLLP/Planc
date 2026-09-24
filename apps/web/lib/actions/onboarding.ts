"use server";

import { redirect } from "next/navigation";
import { prisma } from "@sellly/database";
import { getTemplate, templateSections } from "@sellly/theme";
import { requireUser } from "@/lib/session";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function uniqueSlug(base: string) {
  let slug = base || "store";
  let n = 1;
  while (await prisma.store.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

export async function createStoreAction(name: string, category: string) {
  const { userId } = await requireUser();
  const slug = await uniqueSlug(slugify(name));

  const store = await prisma.store.create({
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
  });

  return { storeId: store.id, slug: store.slug };
}

export async function addFirstProductAction(storeId: string, data: { name: string; price: number; description?: string }) {
  const slug = slugify(data.name);
  await prisma.product.create({
    data: {
      storeId,
      name: data.name,
      slug: await uniqueSlug(slug),
      description: data.description,
      price: data.price,
      status: "ACTIVE",
      inventoryQty: 10,
    },
  });
  await prisma.store.update({ where: { id: storeId }, data: { onboardingStep: "theme" } });
}

export async function setThemeAction(storeId: string, themeName: string) {
  const template = getTemplate(themeName);
  await prisma.theme.create({
    data: {
      storeId,
      name: template.name,
      baseTheme: template.id,
      config: { sections: templateSections(template.id) } as any,
      isActive: true,
    },
  });
  await prisma.store.update({ where: { id: storeId }, data: { onboardingStep: "payment" } });
}

export async function enableCodAction(storeId: string) {
  await prisma.storeSettings.update({ where: { storeId }, data: { codEnabled: true } });
  await prisma.store.update({ where: { id: storeId }, data: { onboardingStep: "publish" } });
}

export async function publishStoreAction(storeId: string) {
  const store = await prisma.store.update({
    where: { id: storeId },
    data: { status: "PUBLISHED", publishedAt: new Date(), onboardingStep: null },
  });
  redirect(`/${store.slug}/overview?published=1`);
}
