/**
 * Shrinks a photo in the browser before it's uploaded: at most 1600px on its
 * longest side, re-encoded as WebP (JPEG where the browser can't write WebP).
 * A 3–5 MB phone photo typically ends up around 150–400 KB, with no visible
 * loss at storefront sizes.
 *
 * GIFs are left alone (re-encoding would drop animation), and so is anything
 * the browser can't decode or that wouldn't get smaller — the original is
 * uploaded instead, so compression can never block an upload.
 */
const MAX_DIMENSION = 1600;
const QUALITY = 0.82;

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

export async function compressImage(file: File): Promise<File> {
  if (file.type === "image/gif" || typeof createImageBitmap !== "function") return file;

  try {
    // from-image applies the photo's EXIF rotation, so portraits stay upright.
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    let blob = await toBlob(canvas, "image/webp", QUALITY);
    // Browsers that can't encode WebP silently return a PNG instead.
    if (!blob || blob.type !== "image/webp") {
      // JPEG has no transparency: put a white background behind the image first.
      ctx.globalCompositeOperation = "destination-over";
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      blob = await toBlob(canvas, "image/jpeg", QUALITY);
    }
    if (!blob || blob.size >= file.size) return file;

    const extension = blob.type === "image/webp" ? "webp" : "jpg";
    const name = `${file.name.replace(/\.[^.]+$/, "") || "image"}.${extension}`;
    return new File([blob], name, { type: blob.type, lastModified: Date.now() });
  } catch {
    return file;
  }
}
