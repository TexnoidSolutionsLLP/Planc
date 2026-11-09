import { ProductsView } from "../../[store]/products/products-view";
import { DEMO_PRODUCTS, DEMO_STORE, DEMO_UNITS_SOLD } from "../fixtures";

const FILTERS: Record<string, (p: (typeof DEMO_PRODUCTS)[number]) => boolean> = {
  active: (p) => p.status === "ACTIVE",
  draft: (p) => p.status === "DRAFT",
  archived: (p) => p.status === "ARCHIVED",
  "out-of-stock": (p) => p.inventoryQty === 0,
  "low-stock": (p) => p.trackInventory && p.inventoryQty > 0 && p.inventoryQty <= 5,
};

export default function DevPreviewProducts({ searchParams }: { searchParams: { status?: string; q?: string } }) {
  const q = searchParams.q?.trim();
  const products = DEMO_PRODUCTS.filter(
    (p) => (!searchParams.status || FILTERS[searchParams.status]?.(p) !== false) && (!q || p.name.toLowerCase().includes(q.toLowerCase())),
  );
  return (
    <ProductsView
      store={DEMO_STORE}
      products={products}
      unitsSold={DEMO_UNITS_SOLD}
      lowStockCount={DEMO_PRODUCTS.filter(FILTERS["low-stock"]).length}
      filter={searchParams.status}
      q={q}
    />
  );
}
