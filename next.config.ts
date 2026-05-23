import type { NextConfig } from "next";
import path from "node:path";

const config: NextConfig = {
  // Strict mode catches common React mistakes; keep on
  reactStrictMode: true,

  // Pin the workspace root so Turbopack ignores any lockfiles in parent dirs
  turbopack: {
    root: path.resolve(__dirname),
  },

  // Logging — useful in dev to see route compilation
  logging: {
    fetches: { fullUrl: false },
  },

  // We don't deploy yet, but configure asset prefixing for future CDN setup
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "subconnects.com" },
    ],
  },

  // Skip linting/type checking during build for now; we'll re-enable when CI is set up
  eslint: { ignoreDuringBuilds: false },
  typescript: { ignoreBuildErrors: false },
};

export default config;
