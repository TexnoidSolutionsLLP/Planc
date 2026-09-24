import type { ShippingProvider } from "../provider";

/** Default provider until a real carrier is connected: one flat rate, no live tracking. */
export function createFlatRateProvider(flatRate: number, _freeShippingMin?: number): ShippingProvider {
  return {
    id: "flat-rate",
    async getRates(_address, _weight) {
      return [{ carrier: "Standard", serviceName: "Standard Delivery", amount: flatRate, etaDays: 5 }];
    },
    async createShipment(orderId) {
      return { trackingNumber: `SLLY-${orderId.slice(-8).toUpperCase()}`, trackingUrl: "" };
    },
    async track() {
      return { status: "pending", lastUpdate: new Date().toISOString() };
    },
    async cancel() {
      return { cancelled: true };
    },
  };
}
