"use server";

import { revalidatePath } from "next/cache";
import { prisma, writeAuditLog } from "@sellly/database";
import type { ThemeConfig } from "@sellly/theme";
import { requireStore } from "@/lib/session";

export async function updateThemeConfigAction(storeSlug: string, config: ThemeConfig) {
  const { store, userId } = await requireStore(storeSlug);

  const theme = await prisma.theme.findFirst({ where: { storeId: store.id, isActive: true } });
  if (!theme) throw new Error("No active theme");

  await prisma.theme.update({ where: { id: theme.id }, data: { config: config as any } });
  await writeAuditLog({ storeId: store.id, userId, action: "theme.updated", entity: "theme", entityId: theme.id });

  revalidatePath(`/${storeSlug}/online-store`);
}

export async function switchThemeAction(storeSlug: string, templateId: string) {
  const { store, userId } = await requireStore(storeSlug);
  const { getTemplate, templateSections } = await import("@sellly/theme");
  const template = getTemplate(templateId);

  await prisma.theme.updateMany({ where: { storeId: store.id }, data: { isActive: false } });
  const existing = await prisma.theme.findFirst({ where: { storeId: store.id, name: template.name } });

  if (existing) {
    await prisma.theme.update({ where: { id: existing.id }, data: { isActive: true, baseTheme: template.id } });
  } else {
    await prisma.theme.create({
      data: { storeId: store.id, name: template.name, baseTheme: template.id, config: { sections: templateSections(template.id) } as any, isActive: true },
    });
  }

  await writeAuditLog({ storeId: store.id, userId, action: "theme.switched", metadata: { themeName: template.name } });
  revalidatePath(`/${storeSlug}/online-store`);
}
