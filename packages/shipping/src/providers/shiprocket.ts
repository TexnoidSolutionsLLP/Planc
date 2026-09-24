import type { ShippingProvider, ShippingAddress } from "../provider";

interface ShiprocketConfig {
  email: string;
  password: string;
  pickupPostalCode: string;
}

const BASE_URL = "https://apiv2.shiprocket.in/v1/external";

/**
 * Shiprocket authenticates with a short-lived bearer token from a
 * username/password login rather than a static API key, so this caches the
 * token in memory and re-authenticates when it's missing or a call 401s —
 * callers never see the auth flow.
 */
function createTokenCache(config: ShiprocketConfig) {
  let token: string | null = null;

  async function login(): Promise<string> {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: config.email, password: config.password }),
    });
    if (!res.ok) throw new Error(`Shiprocket login failed: ${await res.text()}`);
    const data = (await res.json()) as { token: string };
    token = data.token;
    return token;
  }

  return {
    async get(): Promise<string> {
      return token ?? login();
    },
    async refresh(): Promise<string> {
      return login();
    },
  };
}

async function authedFetch(tokenCache: ReturnType<typeof createTokenCache>, path: string, init: RequestInit = {}) {
  let token = await tokenCache.get();
  let res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });

  if (res.status === 401) {
    token = await tokenCache.refresh();
    res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: { ...init.headers, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
  }

  return res;
}

export function createShiprocketProvider(config: ShiprocketConfig): ShippingProvider {
  const tokenCache = createTokenCache(config);

  return {
    id: "shiprocket",

    async getRates(address: ShippingAddress, weightGrams: number) {
      const params = new URLSearchParams({
        pickup_postcode: config.pickupPostalCode,
        delivery_postcode: address.postalCode,
        weight: String(Math.max(weightGrams, 100) / 1000),
        cod: "0",
      });
      const res = await authedFetch(tokenCache, `/courier/serviceability/?${params.toString()}`);
      if (!res.ok) throw new Error(`Shiprocket rate check failed: ${await res.text()}`);
      const data = (await res.json()) as { data?: { available_courier_companies?: any[] } };
      const couriers = data?.data?.available_courier_companies ?? [];
      return couriers.slice(0, 5).map((c: any) => ({
        carrier: c.courier_name,
        serviceName: c.courier_name,
        amount: Number(c.rate),
        etaDays: Number(c.estimated_delivery_days ?? 5),
      }));
    },

    async createShipment(orderId: string, address: ShippingAddress) {
      // A real integration also pushes order line items, package dimensions
      // and the pickup location id — omitted here since that data lives on
      // the Order/Product records and is assembled by the caller before
      // this is wired into checkout/fulfillment.
      const res = await authedFetch(tokenCache, "/orders/create/adhoc", {
        method: "POST",
        body: JSON.stringify({ order_id: orderId, billing_city: address.city, billing_state: address.state, billing_pincode: address.postalCode }),
      });
      if (!res.ok) throw new Error(`Shiprocket shipment creation failed: ${await res.text()}`);
      const data = (await res.json()) as { awb_code?: string; shipment_id?: string | number };
      return {
        trackingNumber: String(data.awb_code ?? data.shipment_id ?? ""),
        trackingUrl: data.awb_code ? `https://shiprocket.co/tracking/${data.awb_code}` : "",
      };
    },

    async track(trackingNumber: string) {
      const res = await authedFetch(tokenCache, `/courier/track/awb/${trackingNumber}`);
      if (!res.ok) return { status: "unknown", lastUpdate: new Date().toISOString() };
      const data = (await res.json()) as { tracking_data?: { shipment_track?: { current_status?: string; updated_at?: string }[] } };
      const activity = data?.tracking_data?.shipment_track?.[0];
      return {
        status: activity?.current_status ?? "unknown",
        lastUpdate: activity?.updated_at ?? new Date().toISOString(),
      };
    },

    async cancel(trackingNumber: string) {
      const res = await authedFetch(tokenCache, "/orders/cancel", {
        method: "POST",
        body: JSON.stringify({ awbs: [trackingNumber] }),
      });
      return { cancelled: res.ok };
    },
  };
}
