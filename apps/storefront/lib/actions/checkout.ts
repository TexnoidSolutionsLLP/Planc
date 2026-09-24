"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { prisma, validateDiscountCode, recordDiscountUsage, writeAuditLog, decryptSecret } from "@sellly/database";
import { notifyOrderEvent } from "@sellly/notifications";
import { createFlatRateProvider } from "@sellly/shipping";
import { createRazorpayProvider } from "@sellly/payments";
import { trackEvent } from "@sellly/analytics";
import { checkRateLimit } from "@sellly/rate-limit";

function clientIp() {
  return headers().get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

const lineSchema = z.object({
  productId: z.string(),
  name: z.string(),
  variantTitle: z.string().optional(),
  price: z.number().positive(),
  quantity: z.number().int().positive(),
  imageUrl: z.string().optional(),
});

const checkoutSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(6),
  email: z.string().email().optional().or(z.literal("")),
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(4),
  paymentMethod: z.enum(["COD", "RAZORPAY"]),
  discountCode: z.string().optional(),
  lines: z.array(lineSchema).min(1),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type CheckoutResult =
  | { error: string }
  | { orderId: string; razorpay?: { keyId: string; razorpayOrderId: string; amount: number; currency: string } };

export async function placeOrderAction(storeSlug: string, input: CheckoutInput): Promise<CheckoutResult> {
  const limit = checkRateLimit(`checkout:${clientIp()}`, 10, 10 * 60 * 1000);
  if (!limit.allowed) return { error: "Too many attempts. Please wait a few minutes and try again." };

  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = parsed.data;

  const store = await prisma.store.findUnique({ where: { slug: storeSlug }, include: { storeSettings: true } });
  if (!store || store.status !== "PUBLISHED") return { error: "Store not found" };

  if (data.paymentMethod === "COD" && !store.storeSettings?.codEnabled) {
    return { error: "Cash on delivery is not available for this store" };
  }

  let razorpayConnection = null;
  if (data.paymentMethod === "RAZORPAY") {
    razorpayConnection = await prisma.paymentConnection.findUnique({
      where: { storeId_provider: { storeId: store.id, provider: "razorpay" } },
    });
    if (!razorpayConnection?.isActive || !razorpayConnection.encryptedSecret) {
      return { error: "Online payment isn't set up for this store yet" };
    }
  }

  // Inventory is source of truth — re-price server-side, never trust client totals.
  const productIds = data.lines.map((l) => l.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds }, storeId: store.id } });
  const productMap = new Map(products.map((p) => [p.id, p]));

  for (const line of data.lines) {
    const product = productMap.get(line.productId);
    if (!product) return { error: `A product in your cart is no longer available` };
    if (product.trackInventory && product.inventoryQty < line.quantity) {
      return { error: `${product.name} only has ${product.inventoryQty} left in stock` };
    }
  }

  const subtotal = data.lines.reduce((sum, l) => sum + Number(productMap.get(l.productId)!.price) * l.quantity, 0);

  let discountTotal = 0;
  let appliedDiscountId: string | null = null;
  let discountFreeShipping = false;
  if (data.discountCode) {
    const result = await validateDiscountCode(store.id, data.discountCode, subtotal, productIds);
    if ("error" in result) return { error: result.error };
    discountTotal = result.discount.amountOff;
    discountFreeShipping = result.discount.freeShipping;
    appliedDiscountId = result.discount.discountId;
  }

  const shippingProvider = createFlatRateProvider(Number(store.storeSettings?.shippingFlatRate ?? 60));
  const [rate] = await shippingProvider.getRates({ city: data.city, state: data.state, postalCode: data.postalCode, country: "India" }, 0);
  const freeShippingMin = store.storeSettings?.freeShippingMin ? Number(store.storeSettings.freeShippingMin) : null;
  const shippingTotal = discountFreeShipping || (freeShippingMin && subtotal >= freeShippingMin) ? 0 : rate.amount;
  const total = Math.max(0, subtotal - discountTotal + shippingTotal);

  const customer = await prisma.customer.findFirst({ where: { storeId: store.id, phone: data.phone } });
  const customerRecord = customer
    ? customer
    : await prisma.customer.create({ data: { storeId: store.id, name: data.name, phone: data.phone, email: data.email || null } });

  const order = await prisma.order.create({
    data: {
      storeId: store.id,
      customerId: customerRecord.id,
      status: data.paymentMethod === "COD" ? "CONFIRMED" : "PENDING",
      customerName: data.name,
      customerEmail: data.email || null,
      customerPhone: data.phone,
      shippingLine1: data.line1,
      shippingLine2: data.line2,
      shippingCity: data.city,
      shippingState: data.state,
      shippingPostal: data.postalCode,
      subtotal,
      discountTotal,
      discountCode: appliedDiscountId ? data.discountCode!.trim().toUpperCase() : null,
      shippingTotal,
      total,
      items: {
        create: data.lines.map((l) => {
          const product = productMap.get(l.productId)!;
          return {
            productId: product.id,
            title: product.name,
            variantTitle: l.variantTitle,
            price: product.price,
            quantity: l.quantity,
            imageUrl: l.imageUrl,
          };
        }),
      },
      events: { create: { status: data.paymentMethod === "COD" ? "CONFIRMED" : "PENDING" } },
      payment: {
        create: {
          provider: data.paymentMethod === "COD" ? "cod" : "razorpay",
          method: data.paymentMethod === "COD" ? "COD" : "UPI",
          status: data.paymentMethod === "COD" ? "PENDING" : "PENDING",
          amount: total,
        },
      },
    },
  });

  await Promise.all(
    data.lines.map((l) =>
      prisma.product.updateMany({
        where: { id: l.productId, storeId: store.id },
        data: { inventoryQty: { decrement: l.quantity } },
      })
    )
  );

  if (appliedDiscountId) {
    await recordDiscountUsage(appliedDiscountId);
  }

  let razorpayPayload: { keyId: string; razorpayOrderId: string; amount: number; currency: string } | undefined;
  if (data.paymentMethod === "RAZORPAY" && razorpayConnection) {
    const provider = createRazorpayProvider({
      keyId: razorpayConnection.publicKey ?? "",
      keySecret: decryptSecret(razorpayConnection.encryptedSecret!),
    });
    const intent = await provider.createPaymentIntent({
      orderId: order.id,
      amount: total,
      currency: store.currency,
      customerPhone: data.phone,
      customerEmail: data.email || undefined,
      notes: { orderId: order.id },
    });
    await prisma.payment.update({ where: { orderId: order.id }, data: { providerRefId: intent.providerRefId } });
    razorpayPayload = {
      keyId: razorpayConnection.publicKey ?? "",
      razorpayOrderId: intent.providerRefId,
      amount: Number(intent.clientPayload.amount),
      currency: String(intent.clientPayload.currency),
    };
  }

  await notifyOrderEvent(
    store.id,
    "order_confirmation",
    { customerEmail: order.customerEmail, customerPhone: order.customerPhone },
    store.storeSettings?.whatsappEnabled ?? false,
    { orderNumber: order.orderNumber, storeName: store.name, total: order.total }
  );

  await Promise.all([
    trackEvent(store.id, "order_placed", { orderId: order.id, total }),
    writeAuditLog({
      storeId: store.id,
      action: "order.placed",
      entity: "order",
      entityId: order.id,
      metadata: { total, paymentMethod: data.paymentMethod, discountCode: order.discountCode },
    }),
  ]);

  return { orderId: order.id, razorpay: razorpayPayload };
}

/** Validates a code without placing an order — used for a live "Apply" button at checkout. */
export async function previewDiscountAction(storeSlug: string, code: string, subtotal: number, productIds: string[]) {
  const limit = checkRateLimit(`discount-preview:${clientIp()}`, 20, 60 * 1000);
  if (!limit.allowed) return { error: "Too many attempts. Please wait a moment." };

  const store = await prisma.store.findUnique({ where: { slug: storeSlug } });
  if (!store) return { error: "Store not found" };
  return validateDiscountCode(store.id, code, subtotal, productIds);
}
