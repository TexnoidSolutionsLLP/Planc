/**
 * Every payment provider (Razorpay, Cashfree, PhonePe, COD) implements this
 * interface. Route handlers and checkout logic only ever depend on this
 * contract — never on a specific provider's SDK — so providers can be added
 * or swapped without touching order/checkout code.
 */
export interface PaymentIntentInput {
  orderId: string;
  amount: number; // in the store's currency's smallest unit is left to the adapter
  currency: string;
  customerEmail?: string;
  customerPhone: string;
  notes?: Record<string, string>;
}

export interface PaymentIntentResult {
  providerRefId: string;
  /** Data the client-side checkout SDK needs to open the payment sheet. */
  clientPayload: Record<string, unknown>;
}

export interface VerifiedWebhookEvent {
  providerRefId: string;
  orderId: string;
  status: "paid" | "failed" | "refunded";
  rawPayload: unknown;
}

export interface RefundInput {
  providerRefId: string;
  amount: number;
  reason?: string;
}

export interface PaymentProvider {
  id: string;
  createPaymentIntent(input: PaymentIntentInput): Promise<PaymentIntentResult>;
  /** MUST verify the provider's signature — never trust the payload alone. */
  verifyWebhook(rawBody: string, signature: string, secret: string): VerifiedWebhookEvent | null;
  refund(input: RefundInput): Promise<{ providerRefId: string; status: "processed" | "failed" }>;
}
