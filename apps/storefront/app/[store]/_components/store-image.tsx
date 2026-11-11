import Image from "next/image";

/** Hosts listed in next.config.mjs `images.remotePatterns` — the only ones next/image may fetch. */
const OPTIMIZABLE_HOSTS = [/^[^.]+\.supabase\.co$/, /^picsum\.photos$/, /\.r2\.dev$/];

function canOptimize(src: string) {
  try {
    const url = new URL(src);
    return url.protocol === "https:" && OPTIMIZABLE_HOSTS.some((host) => host.test(url.hostname));
  } catch {
    return false;
  }
}

/**
 * A store image that fills its parent (which must be `relative` and sized).
 * Images from our storage go through Vercel's image optimizer — resized for
 * the screen, served as WebP and cached at the edge — so shoppers don't
 * download the original and Supabase serves each image only once per cache
 * period. Any other host falls back to a plain <img>, since next/image
 * refuses hosts it isn't configured for.
 */
export function StoreImage({
  src,
  alt,
  sizes,
  className = "",
  priority = false,
}: {
  src: string;
  alt: string;
  /** Rendered width at each breakpoint, e.g. "(min-width: 768px) 50vw, 100vw". */
  sizes: string;
  className?: string;
  /** For the main image above the fold: loads eagerly instead of lazily. */
  priority?: boolean;
}) {
  if (canOptimize(src)) {
    return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={className} />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} loading={priority ? "eager" : "lazy"} className={`absolute inset-0 h-full w-full ${className}`} />
  );
}
