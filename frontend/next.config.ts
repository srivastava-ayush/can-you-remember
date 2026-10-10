import type { NextConfig } from "next";

const apiOrigin =
  process.env.API_ORIGIN ||
  (process.env.NODE_ENV === "production"
    ? "https://can-you-remember.onrender.com"
    : "http://localhost:3001");

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiOrigin}/api/:path*` }];
  },
};

export default nextConfig;
