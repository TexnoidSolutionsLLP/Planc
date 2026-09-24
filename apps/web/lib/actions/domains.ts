"use server";

import { resolveTxt } from "node:dns/promises";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma, writeAuditLog } from "@sellly/database";
import { requireStore } from "@/lib/session";

const hostnameSchema = z
  .string()
  .min(3)
  .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i, "Enter a valid domain, e.g. shop.example.com");

export type FormState = { error?: string } | undefined;

export async function addCustomDomainAction(storeSlug: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const { store, userId } = await requireStore(storeSlug);
  const parsed = hostnameSchema.safeParse((formData.get("hostname") as string)?.toLowerCase().trim());
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const existing = await prisma.domain.findUnique({ where: { hostname: parsed.data } });
  if (existing) return { error: "This domain is already connected to a store" };

  const domain = await prisma.domain.create({
    data: { storeId: store.id, hostname: parsed.data, isSubdomain: false, isPrimary: false, status: "PENDING" },
  });

  await writeAuditLog({ storeId: store.id, userId, action: "domain.added", entity: "domain", entityId: domain.id });
  revalidatePath(`/${storeSlug}/domain`);
}

/**
 * Verification proves domain ownership via a TXT record rather than the
 * CNAME actually resolving — that keeps verification independent of whether
 * the platform's routing/proxy layer for custom domains is live yet.
 */
export async function verifyDomainAction(storeSlug: string, domainId: string) {
  const { store, userId } = await requireStore(storeSlug);
  const domain = await prisma.domain.findFirst({ where: { id: domainId, storeId: store.id } });
  if (!domain) throw new Error("Forbidden");

  let verified = false;
  try {
    const records = await resolveTxt(`_sellly-verify.${domain.hostname}`);
    verified = records.some((chunks) => chunks.join("").trim() === domain.verificationToken);
  } catch {
    verified = false;
  }

  await prisma.domain.update({
    where: { id: domainId },
    data: verified ? { status: "VERIFIED", verifiedAt: new Date() } : { status: "FAILED" },
  });

  await writeAuditLog({ storeId: store.id, userId, action: "domain.verification_attempted", entity: "domain", entityId: domainId, metadata: { verified } });
  revalidatePath(`/${storeSlug}/domain`);

  return { verified };
}

export async function setPrimaryDomainAction(storeSlug: string, domainId: string) {
  const { store, userId } = await requireStore(storeSlug);
  const domain = await prisma.domain.findFirst({ where: { id: domainId, storeId: store.id, status: "VERIFIED" } });
  if (!domain) throw new Error("Domain must be verified before it can be the primary domain");

  await prisma.$transaction([
    prisma.domain.updateMany({ where: { storeId: store.id }, data: { isPrimary: false } }),
    prisma.domain.update({ where: { id: domainId }, data: { isPrimary: true } }),
  ]);

  await writeAuditLog({ storeId: store.id, userId, action: "domain.set_primary", entity: "domain", entityId: domainId });
  revalidatePath(`/${storeSlug}/domain`);
}

export async function removeDomainAction(storeSlug: string, domainId: string) {
  const { store, userId } = await requireStore(storeSlug);
  await prisma.domain.deleteMany({ where: { id: domainId, storeId: store.id, isSubdomain: false } });
  await writeAuditLog({ storeId: store.id, userId, action: "domain.removed", entity: "domain", entityId: domainId });
  revalidatePath(`/${storeSlug}/domain`);
}
