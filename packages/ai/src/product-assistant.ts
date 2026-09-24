import { callClaude, parseJsonResponse } from "./client";

export interface ProductAssistantResult {
  name: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  tags: string[];
  category: string;
  suggestedPrice: number;
  instagramCaption: string;
  whatsappMessage: string;
}

const SYSTEM_PROMPT = `You are a product copywriter for Sellly, a platform that helps small Instagram and WhatsApp sellers turn photos into store listings. Given a product photo, respond with ONLY a JSON object (no markdown, no prose) matching this exact shape:
{
  "name": string (short, sellable product name),
  "description": string (2-3 sentences, warm but concrete, no fake claims),
  "seoTitle": string (under 60 characters),
  "seoDescription": string (under 160 characters),
  "tags": string[] (3-6 lowercase keywords),
  "category": string (one or two words, e.g. "Jewelry", "Home Decor"),
  "suggestedPrice": number (a plausible price in INR based on what's visible, as a plain number, no currency symbol),
  "instagramCaption": string (one caption with 2-3 relevant hashtags),
  "whatsappMessage": string (a short message a seller could paste into a WhatsApp broadcast)
}
Never invent a brand name that isn't visible in the photo. If you can't tell what the product is, make your best reasonable guess rather than refusing.`;

/**
 * Input is the image's raw bytes, already fetched by the caller (the image
 * is already sitting on the merchant's product — see
 * apps/web/lib/actions/ai.ts) — this module has no knowledge of storage.
 */
export async function generateProductCopy(imageBase64: string, mimeType: string): Promise<ProductAssistantResult> {
  const text = await callClaude({
    system: SYSTEM_PROMPT,
    content: [
      { type: "image", source: { type: "base64", media_type: mimeType, data: imageBase64 } },
      { type: "text", text: "Generate the listing JSON for this product photo." },
    ],
    maxTokens: 1024,
  });

  return parseJsonResponse<ProductAssistantResult>(text);
}
