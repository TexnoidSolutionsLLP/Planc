const ANTHROPIC_VERSION = "2023-06-01";
const DEFAULT_MODEL = "claude-sonnet-5";

export function isAiConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

interface MessageContent {
  type: "text" | "image";
  text?: string;
  source?: { type: "base64"; media_type: string; data: string };
}

/**
 * Thin wrapper over the Claude Messages API — no SDK dependency, same
 * pattern as the Razorpay/Shiprocket adapters. Every AI feature in the
 * product (Store Builder, Product Assistant) goes through this single
 * function so there's one place to swap models or providers.
 */
export async function callClaude(input: {
  system: string;
  content: MessageContent[];
  maxTokens?: number;
}): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL,
      max_tokens: input.maxTokens ?? 1024,
      system: input.system,
      messages: [{ role: "user", content: input.content }],
    }),
  });

  if (!res.ok) throw new Error(`Claude API error: ${res.status} ${await res.text()}`);

  const data = (await res.json()) as { content: { type: string; text?: string }[] };
  const textBlock = data.content.find((c) => c.type === "text");
  if (!textBlock?.text) throw new Error("Claude returned no text content");
  return textBlock.text;
}

/** Claude is asked to respond with JSON only; this strips any accidental
 * markdown code fences before parsing so a stray ```json wrapper doesn't
 * break every caller. */
export function parseJsonResponse<T>(text: string): T {
  const cleaned = text.trim().replace(/^```(json)?/i, "").replace(/```$/, "").trim();
  return JSON.parse(cleaned) as T;
}
