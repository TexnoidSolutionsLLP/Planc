/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@sellly/ui", "@sellly/auth", "@sellly/database", "@sellly/storage", "@sellly/rate-limit"],
  async headers() {
    // The admin app is internal: keep it out of search engines and frames.
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
