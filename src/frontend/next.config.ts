import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4000',
        pathname: '/api/media/**',
      },
    ],
    // Configure quality levels for Next.js 16 compatibility
    qualities: [75, 90, 100],
  },
};

export default nextConfig;
