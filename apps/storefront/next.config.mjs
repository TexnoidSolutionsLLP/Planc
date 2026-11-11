/** @type {import('next').NextConfig} */
const nextConfig = {
  // pnpm keeps the Prisma query engine outside each app's folder; make sure Vercel ships it.
  experimental: {
    outputFileTracingIncludes: {
      "/**": ["../../node_modules/.pnpm/@prisma+client*/node_modules/.prisma/client/**"],
    },
  },
  transpilePackages: [
    "@sellly/ui",
    "@sellly/database",
    "@sellly/domains",
    "@sellly/payments",
    "@sellly/shipping",
    "@sellly/notifications",
    "@sellly/analytics",
    "@sellly/rate-limit",
    "@sellly/theme",
  ],
  images: {
    // Product images live in Supabase Storage; r2.dev and picsum cover older/demo data.
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }, { hostname: "picsum.photos" }, { hostname: "**.r2.dev" }],
    // Uploads get a new random name each time, so a cached copy never goes
    // stale: keep it for 31 days and Supabase serves each image about once a month.
    minimumCacheTTL: 60 * 60 * 24 * 31,
    // Fewer widths means fewer stored variants per image. Uploads are at most 1600px wide.
    deviceSizes: [640, 828, 1080, 1280, 1600],
    imageSizes: [32, 64, 96, 128, 256, 384],
  },
};

export default nextConfig;
