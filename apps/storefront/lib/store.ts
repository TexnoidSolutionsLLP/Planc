import { notFound } from "next/navigation";
import { prisma } from "@sellly/database";

export async function getPublishedStore(slug: string) {
  const store = await prisma.store.findUnique({
    where: { slug },
    include: { storeSettings: true },
  });

  if (!store || store.status !== "PUBLISHED") notFound();
  return store;
}
