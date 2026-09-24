import { prisma } from "@sellly/database";

export type NotificationEvent =
  | "order_confirmation"
  | "payment_confirmation"
  | "order_shipped"
  | "order_out_for_delivery"
  | "order_delivered"
  | "order_refunded"
  | "abandoned_cart";

export type NotificationChannelId = "email" | "whatsapp";

interface NotificationChannel {
  id: NotificationChannelId;
  send(recipient: string, message: { subject: string; html: string; text: string }): Promise<boolean>;
}

/** Email is live via Resend's HTTP API (or a console dry-run when unconfigured). */
const emailChannel: NotificationChannel = {
  id: "email",
  async send(recipient, message) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.log(`[email:dry-run] to=${recipient} subject="${message.subject}"`);
      return true;
    }
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.NOTIFICATIONS_FROM_EMAIL ?? "orders@sellly.app",
        to: recipient,
        subject: message.subject,
        html: message.html,
      }),
    });
    return res.ok;
  },
};

/**
 * WhatsApp via Meta's Cloud API. Sending a free-form text message requires
 * the recipient to have messaged the business within the last 24 hours, or
 * a pre-approved message template — this sends a plain text body and is
 * meant for a store that has WhatsApp opt-in from checkout wired up. Falls
 * back to a console dry-run when WHATSAPP_ACCESS_TOKEN isn't configured, so
 * the rest of the notification pipeline (templates, dispatch, audit) can be
 * exercised without a live Meta Business account.
 */
const whatsappChannel: NotificationChannel = {
  id: "whatsapp",
  async send(recipient, message) {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    if (!accessToken || !phoneNumberId) {
      console.log(`[whatsapp:dry-run] to=${recipient} text="${message.text}"`);
      return true;
    }
    const res = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: recipient.replace(/[^0-9]/g, ""),
        type: "text",
        text: { body: message.text },
      }),
    });
    return res.ok;
  },
};

const channels: Record<NotificationChannelId, NotificationChannel> = {
  email: emailChannel,
  whatsapp: whatsappChannel,
};

const templates: Record<NotificationEvent, (data: any) => { subject: string; html: string; text: string }> = {
  order_confirmation: (o) => ({
    subject: `Order #${o.orderNumber} confirmed`,
    html: `<p>Hi ${o.customerName}, your order #${o.orderNumber} for ${o.storeName} has been received.</p>`,
    text: `Hi ${o.customerName}, your order #${o.orderNumber} for ${o.storeName} has been received.`,
  }),
  payment_confirmation: (o) => ({
    subject: `Payment received for order #${o.orderNumber}`,
    html: `<p>We've received your payment of ₹${o.total} for order #${o.orderNumber}.</p>`,
    text: `We've received your payment of ₹${o.total} for order #${o.orderNumber}.`,
  }),
  order_shipped: (o) => ({
    subject: `Order #${o.orderNumber} has shipped`,
    html: `<p>Your order is on its way. Tracking: ${o.trackingNumber ?? "will be shared soon"}.</p>`,
    text: `Your order #${o.orderNumber} has shipped. Tracking: ${o.trackingNumber ?? "will be shared soon"}.`,
  }),
  order_out_for_delivery: (o) => ({
    subject: `Order #${o.orderNumber} is out for delivery`,
    html: `<p>Your order will arrive today.</p>`,
    text: `Your order #${o.orderNumber} is out for delivery and will arrive today.`,
  }),
  order_delivered: (o) => ({
    subject: `Order #${o.orderNumber} delivered`,
    html: `<p>Your order has been delivered. We hope you love it!</p>`,
    text: `Your order #${o.orderNumber} has been delivered. We hope you love it!`,
  }),
  order_refunded: (o) => ({
    subject: `Order #${o.orderNumber} refunded`,
    html: `<p>Your refund of ₹${o.total} has been processed.</p>`,
    text: `Your refund of ₹${o.total} for order #${o.orderNumber} has been processed.`,
  }),
  abandoned_cart: (o) => ({
    subject: `You left something in your cart`,
    html: `<p>Come back and complete your order at ${o.storeName}.</p>`,
    text: `You left something in your cart at ${o.storeName} — come back and complete your order.`,
  }),
};

/**
 * Sends an event to every channel the store has opted into for that order —
 * email when there's a customer email, WhatsApp when the store has enabled
 * it. This is the entry point order/checkout code should call instead of
 * picking a channel itself.
 */
export async function notifyOrderEvent(
  storeId: string,
  event: NotificationEvent,
  order: { customerEmail?: string | null; customerPhone: string },
  whatsappEnabled: boolean,
  data: Record<string, unknown>
) {
  const results = await Promise.all([
    order.customerEmail ? dispatchNotification(storeId, event, order.customerEmail, data, "email") : Promise.resolve(null),
    whatsappEnabled ? dispatchNotification(storeId, event, order.customerPhone, data, "whatsapp") : Promise.resolve(null),
  ]);
  return results;
}

export async function dispatchNotification(
  storeId: string,
  event: NotificationEvent,
  recipient: string,
  data: Record<string, unknown>,
  channel: NotificationChannelId = "email"
) {
  const message = templates[event](data);
  const record = await prisma.notification.create({
    data: { storeId, type: event, channel, recipient, subject: message.subject, status: "PENDING", payload: data as any },
  });

  const sent = await channels[channel].send(recipient, message);

  await prisma.notification.update({
    where: { id: record.id },
    data: { status: sent ? "SENT" : "FAILED", sentAt: sent ? new Date() : null },
  });

  return sent;
}
