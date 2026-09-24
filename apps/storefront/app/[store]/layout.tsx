import { templateCss, templateFontsUrl } from "@sellly/theme";
import { getPublishedStore } from "@/lib/store";
import { getActiveTemplate } from "@/lib/template";
import { CartProvider } from "@/lib/cart-context";
import { StorefrontHeader } from "./_components/header";
import { StorefrontFooter } from "./_components/footer";
import { CartDrawer } from "./_components/cart-drawer";
import { AnnouncementBar } from "./_components/sections/announcement-bar";

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { store: string };
}) {
  const store = await getPublishedStore(params.store);
  const { template, config } = await getActiveTemplate(store.id);
  const announcement = config.sections.find((s) => s.type === "announcement_bar");

  return (
    <CartProvider storeSlug={store.slug}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="stylesheet" href={templateFontsUrl(template)} />
      <style dangerouslySetInnerHTML={{ __html: templateCss(template, config.colors?.accent) }} />
      {announcement?.visible && <AnnouncementBar text={announcement.content?.text} />}
      <StorefrontHeader
        storeName={store.name}
        storeSlug={store.slug}
        logoUrl={store.logoUrl}
        supportEmail={store.storeSettings?.supportEmail}
        variant={template.header}
        shopLabel={template.labels.shop}
        uppercase={template.uppercaseNav}
        portfolio={template.category === "portfolio"}
      />
      <main>{children}</main>
      <StorefrontFooter
        storeName={store.name}
        storeSlug={store.slug}
        description={store.description}
        supportEmail={store.storeSettings?.supportEmail}
        variant={template.footer}
        shopLabel={template.labels.shop}
      />
      <CartDrawer storeSlug={store.slug} />
    </CartProvider>
  );
}
