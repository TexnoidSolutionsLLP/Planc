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
    remotePatterns: [{ hostname: "picsum.photos" }, { hostname: "**.r2.dev" }],
  },
};

export default nextConfig;
