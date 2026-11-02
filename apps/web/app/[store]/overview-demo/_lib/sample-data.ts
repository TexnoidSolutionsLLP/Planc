/**
 * Sample figures for the Overview redesign preview. Deterministic (seeded by the
 * period length) so the page looks the same on every load. Swap these for the
 * real @sellly/analytics queries once the layout is signed off.
 */

export type Channel = "instagram" | "whatsapp" | "direct";

export const CHANNELS: { key: Channel; label: string }[] = [
  { key: "instagram", label: "Instagram" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "direct", label: "Direct link" },
];

const FALLBACK_PRODUCTS = [
  "Aria Hoop Earrings",
  "Luna Layered Necklace",
  "Stella Stack Rings (Set of 3)",
  "Nova Pearl Studs",
  "Celeste Charm Bracelet",
  "Orbit Ear Cuff",
  "Iris Pendant Chain",
];

function rng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

export function buildSampleData(days: number, productNames: string[]) {
  const rand = rng(days * 7919);
  const scale = days / 30;

  const kpis = {
    revenue: { value: Math.round(184_250 * scale), change: 18.4 },
    orders: { value: Math.round(142 * scale), change: 12.1 },
    aov: { value: 1297, change: 5.6 },
    conversion: { value: 3.8, change: 0.6 },
    visits: { value: Math.round(3_740 * scale), change: 22.9 },
    abandoned: { value: Math.round(38 * scale), lost: Math.round(46_800 * scale) },
  };

  const points = Math.min(days, 14);
  const step = days / points;
  const trend = Array.from({ length: points }, (_, i) => {
    const t = i / (points - 1);
    const date = new Date(Date.now() - (days - i * step) * 86_400_000);
    return {
      date: date.toISOString().slice(0, 10),
      instagram: Math.round(3200 + 2600 * t + 500 * Math.sin(t * 4) + rand() * 350),
      whatsapp: Math.round(1800 + 700 * Math.sin(t * 5) + 1400 * t + rand() * 250),
      direct: Math.round(900 + 600 * t + rand() * 200),
    };
  });

  const collections = [
    { name: "Earrings", orders: Math.round(58 * scale), change: 24.2 },
    { name: "Necklaces", orders: Math.round(41 * scale), change: 16.8 },
    { name: "Rings", orders: Math.round(27 * scale), change: 9.4 },
    { name: "Bracelets", orders: Math.round(11 * scale), change: -3.1 },
    { name: "Gift sets", orders: Math.round(5 * scale), change: 2.5 },
  ];

  const sources = [
    { key: "instagram" as Channel, label: "Instagram", share: 58 },
    { key: "whatsapp" as Channel, label: "WhatsApp", share: 31 },
    { key: "direct" as Channel, label: "Direct link", share: 11 },
  ];

  const names = [...productNames, ...FALLBACK_PRODUCTS.filter((n) => !productNames.includes(n))].slice(0, 7);
  const sourceCycle: Channel[] = ["instagram", "whatsapp", "instagram", "direct", "whatsapp", "instagram", "direct"];
  const products = names
    .map((name, i) => {
      const views = Math.round((1400 - i * 170 + rand() * 120) * scale);
      const orders = Math.max(1, Math.round(views * (0.06 - i * 0.006)));
      const price = 899 + Math.round(rand() * 14) * 100;
      return {
        id: `demo-${i}`,
        name,
        views,
        orders,
        revenue: orders * price,
        conversion: (orders / views) * 100,
        change: Number((22 - i * 5.3 + rand() * 4).toFixed(1)),
        stock: Math.round(4 + rand() * 60),
        source: sourceCycle[i % sourceCycle.length],
      };
    })
    .sort((a, b) => b.revenue - a.revenue);

  const customers = ["Priya Sharma", "Ananya Iyer", "Rohan Mehta", "Kavya Reddy", "Meera Nair"];
  const statuses = ["CONFIRMED", "SHIPPED", "PENDING", "DELIVERED", "PROCESSING"] as const;
  const recentOrders = customers.map((customer, i) => ({
    number: 1048 - i,
    customer,
    total: 899 + Math.round(rand() * 30) * 100,
    status: statuses[i],
    source: sourceCycle[i],
    minutesAgo: [12, 48, 95, 180, 320][i],
  }));

  const funnel = [
    { label: "Store visits", value: kpis.visits.value },
    { label: "Viewed a product", value: Math.round(kpis.visits.value * 0.62) },
    { label: "Added to cart", value: Math.round(kpis.visits.value * 0.14) },
    { label: "Started checkout", value: Math.round(kpis.visits.value * 0.071) },
    { label: "Placed order", value: kpis.orders.value },
  ];

  return { kpis, trend, collections, sources, products, recentOrders, funnel };
}

export type SampleData = ReturnType<typeof buildSampleData>;
