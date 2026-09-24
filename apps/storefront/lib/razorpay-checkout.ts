let scriptPromise: Promise<void> | null = null;

function loadRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("Razorpay checkout requires a browser"));
  if ((window as any).Razorpay) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Could not load Razorpay checkout"));
      document.body.appendChild(script);
    });
  }
  return scriptPromise;
}

interface OpenRazorpayCheckoutInput {
  keyId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  storeName: string;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
}

/**
 * Opens Razorpay's hosted payment sheet. This only tells us the customer
 * *attempted* payment — the order is confirmed only once our webhook
 * verifies the signed payment event server-side (see
 * app/api/webhooks/razorpay/route.ts), never from this callback alone.
 */
export async function openRazorpayCheckout(input: OpenRazorpayCheckoutInput): Promise<void> {
  await loadRazorpayScript();

  return new Promise((resolve) => {
    const razorpay = new (window as any).Razorpay({
      key: input.keyId,
      order_id: input.razorpayOrderId,
      amount: input.amount,
      currency: input.currency,
      name: input.storeName,
      prefill: { name: input.customerName, email: input.customerEmail, contact: input.customerPhone },
      handler: () => resolve(),
      modal: { ondismiss: () => resolve() },
    });
    razorpay.open();
  });
}
