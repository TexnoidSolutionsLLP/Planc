import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createUploadUrl } from "@sellly/storage";
import { requireStoreForApi } from "@/lib/session";

const schema = z.object({
  storeSlug: z.string().min(1),
  contentType: z.string().min(1),
  contentLength: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  // Authenticates the merchant and confirms they belong to this store, so an
  // uploaded file always lands under the caller's own storeId prefix — never
  // another merchant's.
  const access = await requireStoreForApi(parsed.data.storeSlug);
  if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { store } = access;

  try {
    const { uploadUrl, publicUrl } = await createUploadUrl(store.id, parsed.data.contentType, parsed.data.contentLength);
    return NextResponse.json({ uploadUrl, publicUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Could not create upload URL" }, { status: 400 });
  }
}
