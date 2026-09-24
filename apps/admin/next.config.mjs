/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@sellly/ui", "@sellly/auth", "@sellly/database"],
};

export default nextConfig;
