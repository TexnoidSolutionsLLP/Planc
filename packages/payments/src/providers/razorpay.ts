import { createHmac, timingSafeEqual } from "node:crypto";
import type { PaymentProvider } from "../provider";

interface RazorpayConfig {
  keyId: string;
  keySecret: string;
}

/**
 * Talks to the Razorpay Orders API directly over fetch — no SDK dependency.
 * Webhook signatures are verified with HMAC-SHA256 per Razorpay's spec;
 * a payment is NEVER marked paid from client-side callback data alone.
 */
export function createRazorpayProvider(config: RazorpayConfig): PaymentProvider {
  const auth = Buffer.from(`${config.keyId}:${config.keySecret}`).toString("base64");

  return {
    id: "razorpay",

    async createPaymentIntent({ orderId, amount, currency, notes }) {
      const res = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // paise
          currency,
          receipt: orderId,
          notes,
        }),
      });
      if (!res.ok) throw new Error(`Razorpay order creation failed: ${await res.text()}`);
      const data = (await res.json()) as { id: string; amount: number; currency: string };
      return {
        providerRefId: data.id,
        clientPayload: { razorpayOrderId: data.id, keyId: config.keyId, amount: data.amount, currency: data.currency },
      };
    },

    verifyWebhook(rawBody, signature, secret) {
      const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
      const expectedBuf = Buffer.from(expected);
      const signatureBuf = Buffer.from(signature);
      if (expectedBuf.length !== signatureBuf.length || !timingSafeEqual(expectedBuf, signatureBuf)) {
        return null;
      }

      const payload = JSON.parse(rawBody);
      const entity = payload.payload?.payment?.entity ?? payload.payload?.order?.entity;
      const eventStatus = payload.event as string;

      const status = eventStatus?.includes("failed") ? "failed" : eventStatus?.includes("refund") ? "refunded" : "paid";

      return {
        providerRefId: entity?.order_id ?? entity?.id,
        orderId: entity?.notes?.orderId ?? entity?.receipt,
        status,
        rawPayload: payload,
      };
    },

    async refund({ providerRefId, amount, reason }) {
      const res = await fetch(`https://api.razorpay.com/v1/payments/${providerRefId}/refund`, {
        method: "POST",
        headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Math.round(amount * 100), notes: { reason } }),
      });
      if (!res.ok) return { providerRefId: "", status: "failed" as const };
      const data = (await res.json()) as { id: string };
      return { providerRefId: data.id, status: "processed" as const };
    },
  };
}
