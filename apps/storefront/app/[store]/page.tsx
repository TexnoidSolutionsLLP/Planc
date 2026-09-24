import { prisma } from "@sellly/database";
import { trackEvent } from "@sellly/analytics";
import type { ThemeSection } from "@sellly/theme";
import { getPublishedStore } from "@/lib/store";
import { getActiveTemplate } from "@/lib/template";
import { HeroSection } from "./_components/sections/hero";
import { FeaturedCollectionSection } from "./_components/sections/featured-collection";
import { ProductGridSection } from "./_components/sections/product-grid";
import { BannerSection } from "./_components/sections/banner";
import { TestimonialsSection } from "./_components/sections/testimonials";
import { FaqSection } from "./_components/sections/faq";
import { NewsletterSection } from "./_components/sections/newsletter";

export default async function StoreHomePage({ params }: { params: { store: string } }) {
  const store = await getPublishedStore(params.store);
  await trackEvent(store.id, "page_view", { page: "home" });

  const [{ template, config }, featuredCollection, products] = await Promise.all([
    getActiveTemplate(store.id),
    prisma.collection.findFirst({ where: { storeId: store.id }, orderBy: { sortOrder: "asc" } }),
    prisma.product.findMany({
      where: { storeId: store.id, status: "ACTIVE" },
      include: { images: { take: 1, orderBy: { position: "asc" } } },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  const productCards = products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: Number(p.price),
    compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
    imageUrl: p.images[0]?.url,
  }));

  function renderSection(section: ThemeSection) {
    if (!section.visible) return null;
    switch (section.type) {
      case "announcement_bar":
        return null; // rendered site-wide in layout.tsx, not per-page
      case "hero":
        return (
          <HeroSection
            key={section.id}
            storeSlug={store.slug}
            storeName={store.name}
            description={store.description}
            title={section.content?.title}
            ctaLabel={section.content?.ctaLabel}
            variant={template.hero}
            imageUrl={productCards[0]?.imageUrl}
            eyebrow={template.labels.heroEyebrow}
          />
        );
      case "featured_collection":
        return <FeaturedCollectionSection key={section.id} name={featuredCollection?.name} />;
      case "product_grid":
        return (
          <ProductGridSection
            key={section.id}
            storeSlug={store.slug}
            title={section.content?.title}
            products={productCards}
            card={template.card}
            viewLabel={template.labels.viewLabel}
          />
        );
      case "banner":
        return <BannerSection key={section.id} text={section.content?.text} ctaLabel={section.content?.ctaLabel} />;
      case "testimonials":
        return <TestimonialsSection key={section.id} quote={section.content?.quote} author={section.content?.author} />;
      case "faq":
        return <FaqSection key={section.id} body={section.content?.body} />;
      case "newsletter":
        return <NewsletterSection
            key={section.id}
            title={template.labels.newsletterTitle}
            body={template.labels.newsletterBody}
            cta={template.labels.newsletterCta}
          />;
      default:
        return null;
    }
  }

  return <div>{config.sections.map(renderSection)}</div>;
}
