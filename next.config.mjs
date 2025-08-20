/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ignore ESLint and TypeScript errors during builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // Enable server actions (experimental feature)
  experimental: {
    serverActions: true,
  },

  // Optimize build for low-resource environments
  output: 'export', // Ensures static export (no Node server required)

  // Custom Webpack config to avoid unsupported Node APIs
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      http: false,
      https: false,
      zlib: false,
      url: false,
    };
    return config;
  },

  // Disable source maps in production to save memory
  productionBrowserSourceMaps: false,

  // Optimize images
  images: {
    unoptimized: true, // Required for `next export` (no Image Optimization server)
    domains: [
      'images.unsplash.com',
      'plus.unsplash.com',
      'firebasestorage.googleapis.com',
      'lh3.googleusercontent.com',
      'storage.googleapis.com',
      'localhost',
      'res.cloudinary.com',
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};

export default nextConfig;
