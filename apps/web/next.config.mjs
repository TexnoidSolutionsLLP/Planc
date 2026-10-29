/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@sellly/ui",
    "@sellly/auth",
    "@sellly/database",
    "@sellly/payments",
    "@sellly/shipping",
    "@sellly/notifications",
    "@sellly/analytics",
    "@sellly/storage",
    "@sellly/rate-limit",
    "@sellly/theme",
    "@sellly/ai",
  ],
  images: {
    // Product images live in Supabase Storage; r2.dev and picsum cover older/demo data.
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }, { hostname: "picsum.photos" }, { hostname: "**.r2.dev" }],
  },
};

export default nextConfig;
