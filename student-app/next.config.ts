import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  output: 'standalone',
  ...(process.env.CAPACITOR_BUILD === 'true' ? {
    output: 'export',
    images: { unoptimized: true },
    trailingSlash: true,
  } : {}),
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    ".space-z.ai",
    "localhost",
  ],
};

export default nextConfig;
