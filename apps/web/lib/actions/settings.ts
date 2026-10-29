"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma, encryptSecret, writeAuditLog } from "@sellly/database";
import { requireStore } from "@/lib/session";

export type FormState = { error?: string; success?: boolean } | undefined;

const storeSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  supportEmail: z.string().email().optional().or(z.literal("")),
  supportPhone: z.string().optional(),
});

export async function updateStoreSettingsAction(storeSlug: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const { store } = await requireStore(storeSlug);
  const parsed = storeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await prisma.store.update({ where: { id: store.id }, data: { name: parsed.data.name, description: parsed.data.description } });
  await prisma.storeSettings.upsert({
    where: { storeId: store.id },
    update: { supportEmail: parsed.data.supportEmail || null, supportPhone: parsed.data.supportPhone },
    create: { storeId: store.id, supportEmail: parsed.data.supportEmail || null, supportPhone: parsed.data.supportPhone },
  });

  revalidatePath(`/${storeSlug}/settings`);
  return { success: true };
}

export async function togglePublishAction(storeSlug: string) {
  const { store } = await requireStore(storeSlug);
  // Only Sellly (with the owner's approval) can lift a suspension.
  if (store.status === "SUSPENDED") throw new Error("This store is suspended. Contact Sellly support.");
  await prisma.store.update({
    where: { id: store.id },
    data: {
      status: store.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED",
      publishedAt: store.status === "PUBLISHED" ? null : new Date(),
    },
  });
  revalidatePath(`/${storeSlug}/settings`);
}

export async function toggleWhatsappAction(storeSlug: string) {
  const { store, userId } = await requireStore(storeSlug);
  const settings = await prisma.storeSettings.findUnique({ where: { storeId: store.id } });
  await prisma.storeSettings.upsert({
    where: { storeId: store.id },
    update: { whatsappEnabled: !settings?.whatsappEnabled },
    create: { storeId: store.id, whatsappEnabled: true },
  });
  await writeAuditLog({ storeId: store.id, userId, action: "settings.whatsapp_toggled" });
  revalidatePath(`/${storeSlug}/settings`);
}

export async function toggleCodAction(storeSlug: string) {
  const { store } = await requireStore(storeSlug);
  const settings = await prisma.storeSettings.findUnique({ where: { storeId: store.id } });
  await prisma.storeSettings.upsert({
    where: { storeId: store.id },
    update: { codEnabled: !settings?.codEnabled },
    create: { storeId: store.id, codEnabled: true },
  });
  revalidatePath(`/${storeSlug}/settings`);
}

const razorpaySchema = z.object({
  publicKey: z.string().min(1),
  secretKey: z.string().min(1),
  webhookSecret: z.string().min(1),
});

export async function connectRazorpayAction(storeSlug: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const { store, userId } = await requireStore(storeSlug);
  const parsed = razorpaySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const encryptedSecret = encryptSecret(parsed.data.secretKey);
  const encryptedWebhookSecret = encryptSecret(parsed.data.webhookSecret);

  await prisma.paymentConnection.upsert({
    where: { storeId_provider: { storeId: store.id, provider: "razorpay" } },
    update: { publicKey: parsed.data.publicKey, encryptedSecret, encryptedWebhookSecret, isActive: true },
    create: { storeId: store.id, provider: "razorpay", publicKey: parsed.data.publicKey, encryptedSecret, encryptedWebhookSecret, isActive: true },
  });
  await prisma.storeSettings.upsert({
    where: { storeId: store.id },
    update: { onlinePaymentEnabled: true },
    create: { storeId: store.id, onlinePaymentEnabled: true },
  });
  await writeAuditLog({ storeId: store.id, userId, action: "payments.razorpay_connected" });

  revalidatePath(`/${storeSlug}/settings`);
  return { success: true };
}
