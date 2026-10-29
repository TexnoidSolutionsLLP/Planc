/**
 * Creates (or updates) the public image bucket with its own size and type
 * limits, so even a misused signed URL can't store a huge or non-image file.
 *
 *   pnpm --filter @sellly/storage storage:setup
 */
// pnpm --filter runs scripts from the package folder; pick up the repo's .env if there is one.
try {
  process.loadEnvFile("../../.env");
} catch {}
import { MAX_UPLOAD_BYTES, storageAdminClient, storageBucket } from "../src/index";

async function main() {
  const supabase = storageAdminClient();
  const bucket = storageBucket();
  const options = {
    public: true, // storefront images must load without a login
    fileSizeLimit: MAX_UPLOAD_BYTES,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  };

  const { data: existing } = await supabase.storage.getBucket(bucket);
  const { error } = existing ? await supabase.storage.updateBucket(bucket, options) : await supabase.storage.createBucket(bucket, options);
  if (error) throw error;
  console.log(`${existing ? "Updated" : "Created"} public bucket "${bucket}" (max ${MAX_UPLOAD_BYTES / 1024 / 1024}MB, images only).`);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
