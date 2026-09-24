import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";
import { createRazorpayProvider } from "./razorpay";

const SECRET = "webhook_secret_for_testing";

function sign(body: string, secret: string) {
  return createHmac("sha256", secret).update(body).digest("hex");
}

describe("razorpay verifyWebhook", () => {
  const provider = createRazorpayProvider({ keyId: "rzp_test_key", keySecret: "unused-here" });

  it("accepts a correctly signed payload", () => {
    const body = JSON.stringify({
      event: "payment.captured",
      payload: { payment: { entity: { id: "pay_123", order_id: "order_123", notes: { orderId: "internal_order_1" } } } },
    });
    const signature = sign(body, SECRET);

    const event = provider.verifyWebhook(body, signature, SECRET);

    expect(event).not.toBeNull();
    expect(event?.status).toBe("paid");
    expect(event?.orderId).toBe("internal_order_1");
  });

  it("rejects a payload with an invalid signature — this is the entire point of webhook verification", () => {
    const body = JSON.stringify({ event: "payment.captured", payload: {} });
    const badSignature = sign(body, "wrong-secret");

    expect(provider.verifyWebhook(body, badSignature, SECRET)).toBeNull();
  });

  it("rejects when the body is altered after signing (tamper detection)", () => {
    const originalBody = JSON.stringify({ event: "payment.captured", payload: { amount: 100 } });
    const signature = sign(originalBody, SECRET);
    const tamperedBody = JSON.stringify({ event: "payment.captured", payload: { amount: 100000 } });

    expect(provider.verifyWebhook(tamperedBody, signature, SECRET)).toBeNull();
  });

  it("classifies failed and refunded events", () => {
    const failedBody = JSON.stringify({ event: "payment.failed", payload: { payment: { entity: { notes: {} } } } });
    const refundBody = JSON.stringify({ event: "refund.processed", payload: { payment: { entity: { notes: {} } } } });

    expect(provider.verifyWebhook(failedBody, sign(failedBody, SECRET), SECRET)?.status).toBe("failed");
    expect(provider.verifyWebhook(refundBody, sign(refundBody, SECRET), SECRET)?.status).toBe("refunded");
  });
});
