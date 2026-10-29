import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

/**
 * Product and collection images live in a public Supabase Storage bucket.
 * Uploads go straight from the merchant's browser to Supabase through a
 * short-lived signed upload URL, so files never pass through our server and
 * a store can only ever write under its own `stores/<storeId>/` prefix.
 *
 * This module is server-only: it uses the service-role key, which must never
 * reach browser code.
 */

const ALLOWED_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8MB — also set as the bucket's own limit by storage:setup

export function storageBucket() {
  return process.env.SUPABASE_STORAGE_BUCKET || "store-media";
}

function supabaseUrl() {
  return (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
}

export function isStorageConfigured() {
  return Boolean(supabaseUrl() && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

let client: SupabaseClient | null = null;

export function storageAdminClient() {
  if (!isStorageConfigured()) {
    throw new Error("File storage is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
  }
  client ??= createClient(supabaseUrl(), process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

export function publicUrlFor(key: string) {
  return `${supabaseUrl()}/storage/v1/object/public/${storageBucket()}/${key}`;
}

/**
 * Returns a signed upload URL scoped to the given store. The browser PUTs the
 * file to `uploadUrl` with its Content-Type header; the URL works once, for
 * this one path, and expires after two hours (Supabase's fixed lifetime).
 */
export async function createUploadUrl(storeId: string, contentType: string, contentLength: number) {
  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    throw new Error(`Unsupported file type: ${contentType}`);
  }
  if (contentLength <= 0 || contentLength > MAX_UPLOAD_BYTES) {
    throw new Error(`File must be under ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB`);
  }

  const extension = contentType.split("/")[1];
  const key = `stores/${storeId}/${randomUUID()}.${extension}`;

  const { data, error } = await storageAdminClient().storage.from(storageBucket()).createSignedUploadUrl(key);
  if (error || !data) throw new Error("Could not prepare the upload. Check that the storage bucket exists.");

  return { uploadUrl: data.signedUrl, publicUrl: publicUrlFor(key), key };
}

/** For the admin system-health page: does the bucket exist and is it reachable? */
export async function checkStorageBucket(): Promise<{ ok: boolean; detail: string }> {
  if (!isStorageConfigured()) return { ok: false, detail: "Not configured" };
  try {
    const { data, error } = await storageAdminClient().storage.getBucket(storageBucket());
    if (error || !data) return { ok: false, detail: `Bucket "${storageBucket()}" not found or not reachable` };
    return { ok: true, detail: `Bucket "${data.name}" reachable (${data.public ? "public" : "private"})` };
  } catch {
    return { ok: false, detail: "Storage service not reachable" };
  }
}
