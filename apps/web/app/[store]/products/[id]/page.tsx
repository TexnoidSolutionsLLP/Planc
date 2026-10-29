import { notFound } from "next/navigation";
import { getTenantDb } from "@sellly/database";
import { requireStore } from "@/lib/session";
import { ProductForm } from "../_components/product-form";
import { updateProductAction, deleteProductAction } from "@/lib/actions/products";
import { ConfirmAction } from "../../_components/confirm-action";

export default async function EditProductPage({ params }: { params: { store: string; id: string } }) {
  const { store } = await requireStore(params.store);
  const db = getTenantDb(store.id);
  const product = await db.product.findFirst({ where: { id: params.id }, include: { images: { orderBy: { position: "asc" } } } });
  if (!product) notFound();

  const action = updateProductAction.bind(null, store.slug, product.id);
  const deleteAction = deleteProductAction.bind(null, store.slug, product.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-title text-primary">{product.name}</h1>
          <p className="text-body text-muted">Edit product details.</p>
        </div>
        <ConfirmAction
          action={deleteAction}
          triggerLabel="Delete"
          title="Delete this product?"
          description="It will disappear from your storefront. Past orders that include it keep their details."
          confirmLabel="Delete product"
        />
      </div>
      <ProductForm
        storeSlug={store.slug}
        action={action}
        submitLabel="Save changes"
        defaultValues={{
          name: product.name,
          description: product.description ?? "",
          price: Number(product.price),
          compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : undefined,
          cost: product.cost != null ? Number(product.cost) : undefined,
          sku: product.sku ?? "",
          inventoryQty: product.inventoryQty,
          status: product.status,
          tags: product.tags.join(", "),
          images: product.images.map((img) => img.url),
        }}
      />
    </div>
  );
}
