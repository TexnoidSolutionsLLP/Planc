import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { isValidStoreSlug } from "@sellly/domains";

/**
 * Drops the cached pages of one store, so a merchant's change shows on the
 * live store straight away. Called by the merchant and admin apps through
 * refreshStorefront() in @sellly/domains, with the shared REVALIDATE_SECRET.
 */
export async function POST(req: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as { slug?: unknown } | null;
  const slug = typeof body?.slug === "string" ? body.slug : "";
  if (!isValidStoreSlug(slug)) return NextResponse.json({ error: "Invalid store" }, { status: 400 });

  // Every page under /<slug>: home, products, and the shared layout.
  revalidatePath(`/${slug}`, "layout");
  return NextResponse.json({ revalidated: true });
}
