import type { PaymentProvider } from "../provider";

/** Cash on delivery is modeled as a provider so checkout code stays uniform. */
export const codProvider: PaymentProvider = {
  id: "cod",
  async createPaymentIntent({ orderId }) {
    return { providerRefId: `cod_${orderId}`, clientPayload: {} };
  },
  verifyWebhook() {
    return null; // COD has no webhook; status changes happen via dashboard fulfillment
  },
  async refund() {
    return { providerRefId: "", status: "failed" as const };
  },
};
