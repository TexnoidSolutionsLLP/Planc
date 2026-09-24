"use client";

import { useRef, useState } from "react";
import { X, Upload } from "lucide-react";

interface ImageUploaderProps {
  storeSlug: string;
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}

/** Uploads directly from the browser to object storage via a presigned URL
 * from /api/uploads — the file itself never passes through our server. */
export function ImageUploader({ storeSlug, value, onChange, max = 6 }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);

    try {
      for (const file of Array.from(files).slice(0, max - value.length)) {
        const presignRes = await fetch("/api/uploads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storeSlug, contentType: file.type, contentLength: file.size }),
        });
        const presign = await presignRes.json();
        if (!presignRes.ok) throw new Error(presign.error ?? "Upload failed");

        const putRes = await fetch(presign.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!putRes.ok) throw new Error("Upload to storage failed");

        onChange([...value, presign.publicUrl]);
      }
    } catch (err: any) {
      setError(err.message ?? "Something went wrong uploading that image");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {value.map((url) => (
          <div key={url} className="group relative h-20 w-20 overflow-hidden rounded-sm border border-border">
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(value.filter((u) => u !== url))}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Remove image"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {value.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-sm border border-dashed border-border text-muted hover:border-brand hover:text-primary disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            <span className="text-caption">{uploading ? "Uploading…" : "Add"}</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {error && <p className="mt-2 text-small text-error">{error}</p>}
    </div>
  );
}
