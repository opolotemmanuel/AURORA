import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  cacheComponents: true,
  output: "standalone",
  outputFileTracingIncludes: {
    "/*": ["./generated/prisma/**/*"],
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
}

export default nextConfig
