import Image from "next/image";
import Link from "next/link";
import { prisma } from "@sellly/database";
import { buttonVariants, EmptyState } from "@sellly/ui";
import { requireStore } from "@/lib/session";

export default async function CollectionsPage({ params }: { params: { store: string } }) {
  const { store } = await requireStore(params.store);
  const collections = await prisma.collection.findMany({
    where: { storeId: store.id },
    include: { _count: { select: { products: true } } },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title text-primary">Collections</h1>
          <p className="text-body text-muted">Group products for your storefront navigation.</p>
        </div>
        <Link href={`/${store.slug}/collections/new`} className={buttonVariants({})}>
          Add collection
        </Link>
      </div>

      {collections.length === 0 ? (
        <EmptyState
          title="No collections yet"
          description="Group similar products together so customers can browse faster."
          action={
            <Link href={`/${store.slug}/collections/new`} className={buttonVariants({})}>
              Add collection
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {collections.map((c) => (
            <div key={c.id} className="overflow-hidden rounded-md border border-border bg-surface">
              <div className="flex h-32 items-center justify-center bg-secondary">
                {c.imageUrl ? (
                  <Image src={c.imageUrl} alt={c.name} width={200} height={128} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-caption text-muted">No image</span>
                )}
              </div>
              <div className="p-4">
                <p className="font-medium text-primary">{c.name}</p>
                <p className="text-caption text-muted">{c._count.products} products</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
