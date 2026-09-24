export interface ShippingAddress {
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface RateQuote {
  carrier: string;
  serviceName: string;
  amount: number;
  etaDays: number;
}

/** Swappable so a real carrier (Shiprocket, Delhivery…) can replace the flat-rate default. */
export interface ShippingProvider {
  id: string;
  getRates(address: ShippingAddress, weightGrams: number): Promise<RateQuote[]>;
  createShipment(orderId: string, address: ShippingAddress): Promise<{ trackingNumber: string; trackingUrl: string }>;
  track(trackingNumber: string): Promise<{ status: string; lastUpdate: string }>;
  cancel(trackingNumber: string): Promise<{ cancelled: boolean }>;
}
