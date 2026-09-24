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
    remotePatterns: [{ hostname: "picsum.photos" }, { hostname: "**.r2.dev" }],
  },
};

export default nextConfig;
