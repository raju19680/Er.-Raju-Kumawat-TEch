import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Enable static export for Capacitor mobile app
  // When building for mobile, set CAPACITOR_BUILD=true
  ...(process.env.CAPACITOR_BUILD === 'true' ? {
    output: 'export',
    images: { unoptimized: true },
    trailingSlash: true,
  } : {}),
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
    proxyClientMaxBodySize: 50000000,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    ".space-z.ai",
    "localhost",
  ],
};

export default nextConfig;
