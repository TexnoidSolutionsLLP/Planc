import type { OrderRow } from "../[store]/orders/orders-view";
import type { ProductRow } from "../[store]/products/products-view";
import type { OverviewViewProps } from "../[store]/overview/overview-view";

/**
 * Made-up data for the no-login UI preview. Nothing here is real: no
 * customers, orders or revenue. The store slug is "dev-preview" so the
 * dashboard's links resolve to /dev-preview/... routes.
 */
export const DEMO_STORE = { slug: "dev-preview", name: "Aria Jewelry" };

const day = 24 * 60 * 60 * 1000;
const ago = (days: number) => new Date(Date.now() - days * day);

export const DEMO_ORDERS: OrderRow[] = [
  {
    id: "o1",
    orderNumber: 1042,
    customerName: "Sample customer A",
    customerPhone: "9876543210",
    total: 1799,
    status: "PENDING",
    createdAt: ago(0),
    _count: { items: 2 },
    payment: { method: "COD", status: "PENDING" },
    shipments: [],
  },
  {
    id: "o2",
    orderNumber: 1041,
    customerName: "Sample customer B",
    customerPhone: "9123456780",
    total: 899,
    status: "CONFIRMED",
    createdAt: ago(1),
    _count: { items: 1 },
    payment: { method: "UPI", status: "PAID" },
    shipments: [],
  },
  {
    id: "o3",
    orderNumber: 1040,
    customerName: "Sample customer C",
    customerPhone: null,
    total: 2398,
    status: "SHIPPED",
    createdAt: ago(2),
    _count: { items: 3 },
    payment: { method: "CARD", status: "PAID" },
    shipments: [{ status: "IN_TRANSIT" }],
  },
  {
    id: "o4",
    orderNumber: 1039,
    customerName: "Sample customer D",
    customerPhone: "9988776655",
    total: 1299,
    status: "DELIVERED",
    createdAt: ago(4),
    _count: { items: 1 },
    payment: { method: "COD", status: "PAID" },
    shipments: [{ status: "DELIVERED" }],
  },
  {
    id: "o5",
    orderNumber: 1038,
    customerName: "Sample customer E",
    customerPhone: "9090909090",
    total: 749,
    status: "CANCELLED",
    createdAt: ago(6),
    _count: { items: 1 },
    payment: null,
    shipments: [],
  },
];

export const DEMO_PRODUCTS: ProductRow[] = [
  { id: "p1", name: "Aria Hoop Earrings", status: "ACTIVE", price: 899, cost: 420, trackInventory: true, inventoryQty: 24, images: [] },
  { id: "p2", name: "Studio Layered Necklace", status: "ACTIVE", price: 1299, cost: 610, trackInventory: true, inventoryQty: 4, images: [] },
  { id: "p3", name: "Sunday Stacking Rings (set of 3)", status: "ACTIVE", price: 749, cost: null, trackInventory: true, inventoryQty: 0, images: [] },
  { id: "p4", name: "Thread Anklet", status: "DRAFT", price: 499, cost: 180, trackInventory: false, inventoryQty: 0, images: [] },
  { id: "p5", name: "Slow Hours Cuff", status: "ARCHIVED", price: 1599, cost: 800, trackInventory: true, inventoryQty: 12, images: [] },
];

export const DEMO_UNITS_SOLD = new Map<string | null, number>([
  ["p1", 31],
  ["p2", 18],
  ["p3", 9],
]);

export function demoOverview(days: number): OverviewViewProps {
  const revenueByDay = Array.from({ length: Math.min(days, 14) }, (_, i) => {
    const date = ago(Math.min(days, 14) - 1 - i)
      .toISOString()
      .slice(0, 10);
    return { date, revenue: 900 + ((i * 373) % 2100) };
  });
  return {
    store: DEMO_STORE,
    firstName: "Priya",
    days,
    storeUrl: "https://sellly.app/dev-preview",
    current: { revenue: 48250, orders: 36, customers: 21, averageOrderValue: 1340 },
    previous: { revenue: 39100, orders: 31, customers: 18, averageOrderValue: 1261 },
    topProducts: [
      { productId: "p1", title: "Aria Hoop Earrings", unitsSold: 31 },
      { productId: "p2", title: "Studio Layered Necklace", unitsSold: 18 },
      { productId: "p3", title: "Sunday Stacking Rings", unitsSold: 9 },
    ],
    revenueByDay,
    funnel: { conversionRate: 3.4, pageViews: 1060, addToCart: 142, checkoutStarted: 58 },
    recentOrders: DEMO_ORDERS.slice(0, 5).map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      status: o.status,
      total: o.total,
    })),
    productCount: DEMO_PRODUCTS.length,
    checklist: [
      { done: true, label: "Add your first product", href: "/dev-preview/products" },
      { done: true, label: "Publish your store", href: "/dev-preview/overview" },
      { done: false, label: "Set up a way to get paid", href: "/dev-preview/overview" },
      { done: false, label: "Share your link and get your first order", href: "/dev-preview/overview" },
    ],
  };
}
