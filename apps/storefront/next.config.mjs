/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@sellly/ui",
    "@sellly/database",
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
  },
};

export default nextConfig;
