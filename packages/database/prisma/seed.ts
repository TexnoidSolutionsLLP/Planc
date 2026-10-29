import { PrismaClient } from "@prisma/client";

/**
 * Demo data for local development: one merchant, one store, a few products,
 * customers and orders. It never creates Sellly staff — use
 * `pnpm staff:create` for that — and refuses to run in production.
 */
if (process.env.NODE_ENV === "production" && process.env.ALLOW_SEED !== "true") {
  console.error("Refusing to seed: NODE_ENV is production. Demo accounts with known passwords must never exist in production.");
  process.exit(1);
}

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

const DEMO_EMAIL = "demo@sellly.app";
const DEMO_PASSWORD = "password123";

/**
 * Creates (or finds) the demo merchant's Supabase login through the Auth admin
 * API, so the seeded account can actually sign in. Skipped when Supabase isn't
 * configured; the profile is then linked on first sign-in instead.
 */
async function ensureSupabaseLogin(email: string, password: string): Promise<string | null> {
  const url = (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL)?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  const headers = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };

  const created = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers,
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { name: "Demo Seller" } }),
  });
  if (created.ok) return ((await created.json()) as { id: string }).id;

  // Already exists: find it.
  for (let page = 1; page < 50; page++) {
    const res = await fetch(`${url}/auth/v1/admin/users?page=${page}&per_page=1000`, { headers });
    if (!res.ok) break;
    const { users } = (await res.json()) as { users: { id: string; email?: string }[] };
    const found = users.find((u) => u.email?.toLowerCase() === email);
    if (found) return found.id;
    if (users.length < 1000) break;
  }
  console.warn(`Could not create or find the Supabase login for ${email} (${created.status}).`);
  return null;
}

async function main() {
  const authId = await ensureSupabaseLogin(DEMO_EMAIL, DEMO_PASSWORD);
  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: authId ? { authId } : {},
    create: { email: DEMO_EMAIL, name: "Demo Seller", phone: "+91 98765 43210", authId },
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

  await seedOrders(store.id);

  console.log(`\nDemo merchant login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}${authId ? "" : " (Supabase not configured — create this user in Supabase to sign in)"}`);
  console.log("Staff accounts aren't seeded. Create one with: pnpm staff:create --email you@company.com");
  console.log(`Store: ${store.slug}`);
}

/** A handful of customers and orders across statuses, created once. */
async function seedOrders(storeId: string) {
  if ((await prisma.order.count({ where: { storeId } })) > 0) return;
  const products = await prisma.product.findMany({ where: { storeId }, orderBy: { createdAt: "asc" } });
  if (products.length === 0) return;
  await prisma.product.update({ where: { id: products[0].id }, data: { cost: 420, inventoryQty: 3 } });

  const people = [
    { name: "Priya Sharma", phone: "9876543210", email: "priya@example.com", city: "Bengaluru", state: "Karnataka", postal: "560001" },
    { name: "Arjun Mehta", phone: "9123456780", email: null, city: "Pune", state: "Maharashtra", postal: "411001" },
    { name: "Sara Khan", phone: "9988776655", email: "sara@example.com", city: "Hyderabad", state: "Telangana", postal: "500001" },
  ];
  const orders = [
    { who: 0, product: 0, qty: 2, status: "DELIVERED", method: "UPI", paid: true, daysAgo: 40 },
    { who: 1, product: 1, qty: 1, status: "SHIPPED", method: "COD", paid: false, daysAgo: 6 },
    { who: 2, product: 2, qty: 3, status: "CONFIRMED", method: "UPI", paid: true, daysAgo: 2 },
    { who: 0, product: 1, qty: 1, status: "PENDING", method: "COD", paid: false, daysAgo: 0 },
    { who: 1, product: 0, qty: 1, status: "CANCELLED", method: "COD", paid: false, daysAgo: 12 },
  ] as const;

  const customers = [];
  for (const p of people) {
    customers.push(
      await prisma.customer.create({
        data: {
          storeId,
          name: p.name,
          phone: p.phone,
          email: p.email,
          addresses: { create: { line1: "12 MG Road", city: p.city, state: p.state, postalCode: p.postal, isDefault: true } },
        },
      })
    );
  }

  for (const o of orders) {
    const person = people[o.who];
    const product = products[o.product % products.length];
    const subtotal = Number(product.price) * o.qty;
    const createdAt = new Date(Date.now() - o.daysAgo * 86400_000);
    const shipped = o.status === "SHIPPED" || o.status === "DELIVERED";
    await prisma.order.create({
      data: {
        storeId,
        customerId: customers[o.who].id,
        status: o.status,
        customerName: person.name,
        customerPhone: person.phone,
        customerEmail: person.email,
        shippingLine1: "12 MG Road",
        shippingCity: person.city,
        shippingState: person.state,
        shippingPostal: person.postal,
        subtotal,
        total: subtotal,
        createdAt,
        items: { create: { productId: product.id, title: product.name, price: product.price, quantity: o.qty } },
        payment: {
          create: { provider: o.method === "COD" ? "cod" : "razorpay", method: o.method, status: o.paid ? "PAID" : "PENDING", amount: subtotal, createdAt },
        },
        events: { create: { status: o.status, createdAt } },
        ...(shipped && {
          shipments: {
            create: { provider: "flat-rate", status: o.status === "DELIVERED" ? "DELIVERED" : "IN_TRANSIT", shippedAt: createdAt, deliveredAt: o.status === "DELIVERED" ? createdAt : null },
          },
        }),
      },
    });
  }
  console.log(`Seeded ${orders.length} demo orders for ${people.length} customers`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
