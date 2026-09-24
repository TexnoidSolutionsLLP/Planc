import { callClaude, parseJsonResponse } from "./client";

export interface StoreBuilderResult {
  heroTitle: string;
  heroDescription: string;
  heroCtaLabel: string;
  themeRecommendation: string;
  collections: { name: string; description: string }[];
  seoTitle: string;
  seoDescription: string;
}

/** Mirrors the template names in @sellly/theme. Botanica=beauty, Street=fashion, Hearth=home, Sweet=food,
 * Volt=electronics; Folio/Lens/Atelier/Agency/Mono are portfolio templates. */
const THEMES = ["Minimal", "Modern", "Editorial", "Luxury", "Bold", "Botanica", "Street", "Hearth", "Sweet", "Volt", "Folio", "Lens", "Atelier", "Agency", "Mono"];

const SYSTEM_PROMPT = `You are a brand strategist for Sellly, a platform that helps small Instagram/WhatsApp sellers launch a store in minutes. Given a short description of a merchant's business and desired aesthetic, respond with ONLY a JSON object (no markdown, no prose) matching this exact shape:
{
  "heroTitle": string (a short, punchy homepage headline — NOT just the business name),
  "heroDescription": string (one sentence expanding on the headline),
  "heroCtaLabel": string (2-4 words, e.g. "Shop the collection"),
  "themeRecommendation": one of ${JSON.stringify(THEMES)},
  "collections": array of 2-4 objects { "name": string, "description": string } — plausible product collections for this business,
  "seoTitle": string (under 60 characters),
  "seoDescription": string (under 160 characters)
}
Base every field on what the merchant actually described — don't invent an unrelated business.`;

/**
 * Pure generation — nothing here writes to the database. The caller
 * (apps/web/lib/actions/ai.ts) shows this as a draft and only applies it to
 * the store's theme/collections after explicit merchant approval, per the
 * product spec: "merchant approval is required before publishing."
 */
export async function generateStoreBuilderDraft(description: string): Promise<StoreBuilderResult> {
  const text = await callClaude({
    system: SYSTEM_PROMPT,
    content: [{ type: "text", text: description }],
    maxTokens: 1024,
  });

  return parseJsonResponse<StoreBuilderResult>(text);
}
