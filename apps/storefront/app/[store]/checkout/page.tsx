import { prisma } from "@sellly/database";
import { trackEvent } from "@sellly/analytics";
import { getPublishedStore } from "@/lib/store";
import { CheckoutForm } from "./_components/checkout-form";

export default async function CheckoutPage({ params }: { params: { store: string } }) {
  const store = await getPublishedStore(params.store);
  const settings = await prisma.storeSettings.findUnique({ where: { storeId: store.id } });
  await trackEvent(store.id, "checkout_started");

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="mb-6 text-h1 text-primary">Checkout</h1>
      <CheckoutForm
        storeSlug={store.slug}
        storeName={store.name}
        codEnabled={settings?.codEnabled ?? true}
        onlinePaymentEnabled={settings?.onlinePaymentEnabled ?? false}
      />
    </div>
  );
}
