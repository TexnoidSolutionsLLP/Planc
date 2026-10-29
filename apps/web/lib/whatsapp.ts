/**
 * Normalises a phone number to the digits-only international form wa.me
 * expects. Numbers without a country code are treated as Indian (+91), which
 * is what the storefront checkout collects. Returns null when the number
 * can't be a valid WhatsApp number, so the UI hides the link instead of
 * opening a broken chat.
 */
export function whatsappNumber(phone: string | null | undefined, defaultCountryCode = "91"): string | null {
  if (!phone) return null;
  const trimmed = phone.trim();
  let digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;

  if (trimmed.startsWith("+")) return digits.length >= 8 && digits.length <= 15 ? digits : null;
  if (digits.startsWith("00")) {
    digits = digits.slice(2);
    return digits.length >= 8 && digits.length <= 15 ? digits : null;
  }
  if (defaultCountryCode === "91") {
    if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
    if (digits.length === 10) return /^[6-9]/.test(digits) ? `91${digits}` : null;
    if (digits.length === 12 && digits.startsWith("91")) return /^91[6-9]/.test(digits) ? digits : null;
    return null;
  }
  return digits.length >= 8 && digits.length <= 15 ? `${defaultCountryCode}${digits}` : null;
}

/**
 * A wa.me link that opens a chat with the message pre-filled. Nothing is sent
 * until the merchant presses send in WhatsApp themselves.
 */
export function whatsappOrderLink(input: {
  phone: string | null | undefined;
  customerName: string;
  storeName: string;
  orderNumber: number;
}): string | null {
  const number = whatsappNumber(input.phone);
  if (!number) return null;
  const firstName = input.customerName.trim().split(/\s+/)[0] || "there";
  const text = `Hi ${firstName}, this is ${input.storeName} about your order #${input.orderNumber}.`;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
