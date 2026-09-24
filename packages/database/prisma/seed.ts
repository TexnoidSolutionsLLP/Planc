import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "node:crypto";

const DEFAULT_SECTIONS = [
  { id: "announcement_bar", type: "announcement_bar", visible: true, content: { text: "Free shipping over ₹999" } },
  { id: "hero", type: "hero", visible: true, content: {} },
  { id: "featured_collection", type: "featured_collection", visible: true, content: {} },
  { id: "product_grid", type: "product_grid", visible: true, content: { title: "New arrivals" } },
  { id: "banner", type: "banner", visible: false, content: {} },
  { id: "testimonials", type: "testimonials", visible: false, content: {} },
  { id: "faq", type: "faq", visible: false, content: {} },
  { id: "newsletter", type: "newsletter", visible: true, content: {} },
];

const prisma = new PrismaClient();

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "demo@sellly.app" },
    update: {},
    create: {
      email: "demo@sellly.app",
      name: "Demo Seller",
      passwordHash: hashPassword("password123"),
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@sellly.app" },
    update: {},
    create: {
      email: "admin@sellly.app",
      name: "Platform Admin",
      passwordHash: hashPassword("password123"),
      platformRole: "PLATFORM_ADMIN",
    },
  });

  const store = await prisma.store.upsert({
    where: { slug: "aria-jewelry" },
    update: {},
    create: {
      name: "Aria Jewelry",
      slug: "aria-jewelry",
      category: "Jewelry & Accessories",
      description: "Handmade minimal jewelry, made in small batches.",
      status: "PUBLISHED",
      publishedAt: new Date(),
      members: { create: { userId: user.id, role: "OWNER" } },
      storeSettings: { create: { codEnabled: true, onlinePaymentEnabled: false } },
      subscription: { create: { plan: "FREE" } },
      domains: { create: { hostname: "aria-jewelry", isSubdomain: true, isPrimary: true, status: "VERIFIED" } },
      themes: { create: { name: "Minimal", baseTheme: "minimal", config: { sections: DEFAULT_SECTIONS }, isActive: true } },
    },
  });

  const collection = await prisma.collection.upsert({
    where: { storeId_slug: { storeId: store.id, slug: "best-sellers" } },
    update: {},
    create: {
      storeId: store.id,
      name: "Best Sellers",
      slug: "best-sellers",
      description: "Our most loved pieces",
      sortOrder: 0,
    },
  });

  const products = [
    { name: "Aria Hoop Earrings", price: 899, desc: "Lightweight gold-plated hoops for everyday wear." },
    { name: "Luna Layered Necklace", price: 1499, desc: "Delicate layered chain necklace with moon charm." },
    { name: "Stella Stack Rings (Set of 3)", price: 649, desc: "Minimal stacking rings, adjustable fit." },
  ];

  for (const p of products) {
    const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const product = await prisma.product.upsert({
      where: { storeId_slug: { storeId: store.id, slug } },
      update: {},
      create: {
        storeId: store.id,
        name: p.name,
        slug,
        description: p.desc,
        status: "ACTIVE",
        price: p.price,
        compareAtPrice: p.price + 300,
        inventoryQty: 25,
        tags: ["new", "handmade"],
        images: { create: [{ url: `https://picsum.photos/seed/${slug}/800/800`, position: 0 }] },
        collections: { create: [{ collectionId: collection.id }] },
      },
    });
    console.log(`Seeded product: ${product.name}`);
  }

  console.log("\nDemo merchant login: demo@sellly.app / password123");
  console.log("Platform admin login: admin@sellly.app / password123");
  console.log(`Store: ${store.slug}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
