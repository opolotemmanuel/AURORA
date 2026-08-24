import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  cacheComponents: true,
  output: "standalone",
  outputFileTracingIncludes: {
    // lib/pdf/brand-logo.ts reads the letterhead mark from disk at runtime.
    // Standalone output does not copy `public/`, and file tracing cannot always
    // follow a path built with path.join, so it is named here rather than left
    // to be discovered — a missed trace shows up as PDF generation throwing in
    // production while every local check passes.
    "/*": ["./generated/prisma/**/*", "./public/icons/logo-print.png"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "www.auroraorganics.co",
      },
    ],
  },
  async headers() {
    return [
      {
        // The worker must never be served from cache, or a stale one keeps
        // controlling the page after a deploy.
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
        ],
      },
    ]
  },
}

export default nextConfig
