import { NextRequest, NextResponse } from "next/server";
import { prisma, decryptSecret } from "@sellly/database";
import { createRazorpayProvider } from "@sellly/payments";

/**
 * Razorpay signs every webhook with HMAC-SHA256 of the raw body using the
 * per-store webhook secret. We verify that signature before touching any
 * order — a client-side "payment succeeded" callback is never trusted.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event;
  try {
    const payload = JSON.parse(rawBody);
    const orderReceipt = payload.payload?.payment?.entity?.notes?.orderId ?? payload.payload?.order?.entity?.receipt;
    const order = orderReceipt ? await prisma.order.findUnique({ where: { id: orderReceipt } }) : null;
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const connection = await prisma.paymentConnection.findUnique({
      where: { storeId_provider: { storeId: order.storeId, provider: "razorpay" } },
    });
    if (!connection?.encryptedSecret || !connection.encryptedWebhookSecret) {
      return NextResponse.json({ error: "Store not configured" }, { status: 400 });
    }

    const keySecret = decryptSecret(connection.encryptedSecret);
    const webhookSecret = decryptSecret(connection.encryptedWebhookSecret);

    const provider = createRazorpayProvider({ keyId: connection.publicKey ?? "", keySecret });
    event = provider.verifyWebhook(rawBody, signature, webhookSecret);
    if (!event) return NextResponse.json({ error: "Invalid signature" }, { status: 400 });

    const paymentStatus = event.status === "paid" ? "PAID" : event.status === "refunded" ? "REFUNDED" : "FAILED";
    await prisma.payment.update({
      where: { orderId: order.id },
      data: { status: paymentStatus, providerRefId: event.providerRefId, webhookVerified: true, rawPayload: event.rawPayload as any },
    });

    if (paymentStatus === "PAID") {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "CONFIRMED", events: { create: { status: "CONFIRMED", message: "Payment verified via webhook" } } },
      });
    } else if (paymentStatus === "FAILED") {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "FAILED", events: { create: { status: "FAILED", message: "Payment failed" } } },
      });
    }

    await prisma.auditLog.create({
      data: {
        storeId: order.storeId,
        action: "payment.webhook_verified",
        entity: "order",
        entityId: order.id,
        metadata: { status: paymentStatus },
      },
    });

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Malformed payload" }, { status: 400 });
  }
}
