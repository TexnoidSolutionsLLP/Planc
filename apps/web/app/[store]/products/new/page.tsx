import { requireStore } from "@/lib/session";
import { ProductForm } from "../_components/product-form";
import { createProductAction } from "@/lib/actions/products";

export default async function NewProductPage({ params }: { params: { store: string } }) {
  const { store } = await requireStore(params.store);
  const action = createProductAction.bind(null, store.slug);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-title text-primary">Add product</h1>
        <p className="text-body text-muted">Fill in the essentials — you can add variants and SEO later.</p>
      </div>
      <ProductForm storeSlug={store.slug} action={action} />
    </div>
  );
}
