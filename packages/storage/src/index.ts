import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";

/**
 * Cloudflare R2 speaks the S3 API, so the same client works for R2 or real
 * S3 by swapping `STORAGE_ENDPOINT` — nothing else in the app depends on
 * which one is configured.
 */
function getClient() {
  const endpoint = process.env.STORAGE_ENDPOINT;
  const accessKeyId = process.env.STORAGE_ACCESS_KEY_ID;
  const secretAccessKey = process.env.STORAGE_SECRET_ACCESS_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error("Object storage is not configured (STORAGE_ENDPOINT / STORAGE_ACCESS_KEY_ID / STORAGE_SECRET_ACCESS_KEY)");
  }

  return new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
}

const ALLOWED_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8MB

export function isStorageConfigured() {
  return Boolean(process.env.STORAGE_ENDPOINT && process.env.STORAGE_ACCESS_KEY_ID && process.env.STORAGE_SECRET_ACCESS_KEY);
}

/**
 * Returns a short-lived presigned PUT URL scoped to the given store, so a
 * merchant's browser can upload directly to R2 without the file ever
 * passing through our server, and one store can never write into another
 * store's key prefix.
 */
export async function createUploadUrl(storeId: string, contentType: string, contentLength: number) {
  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    throw new Error(`Unsupported file type: ${contentType}`);
  }
  if (contentLength <= 0 || contentLength > MAX_UPLOAD_BYTES) {
    throw new Error(`File must be under ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB`);
  }

  const bucket = process.env.STORAGE_BUCKET;
  if (!bucket) throw new Error("STORAGE_BUCKET is not configured");

  const extension = contentType.split("/")[1];
  const key = `stores/${storeId}/${randomUUID()}.${extension}`;

  const client = getClient();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    ContentLength: contentLength, // the presigned signature binds to this exact size — the client's PUT must match it
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 300 });
  const publicBase = process.env.STORAGE_PUBLIC_URL?.replace(/\/$/, "");
  const publicUrl = publicBase ? `${publicBase}/${key}` : uploadUrl.split("?")[0];

  return { uploadUrl, publicUrl, key };
}
