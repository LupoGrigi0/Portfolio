/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features for performance monitoring
  experimental: {
    // Enable Server Actions for analytics
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },

  // Enable React Profiler in development
  reactStrictMode: true,

  // Webpack config for bundle analysis
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Enable source maps in production for debugging
      config.devtool = 'source-map';
    }
    return config;
  },

  // Image optimization settings
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};

export default nextConfig;
