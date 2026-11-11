import { cache } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@sellly/database";

/** The live store for a slug, or a 404. Deduped per request: layout and page both call it. */
export const getPublishedStore = cache(async (slug: string) => {
  const store = await prisma.store.findUnique({
    where: { slug },
    include: { storeSettings: true },
  });

  if (!store || store.status !== "PUBLISHED") notFound();
  return store;
});
