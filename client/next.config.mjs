/** @type {import('next').NextConfig} */
const nextConfig = {
  // Вимикаємо standalone для інтеграції з Express
  // output: 'standalone',
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/uploads/**',
      },
    ],
    unoptimized: process.env.NODE_ENV === 'production',
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Вимикаємо power verbosity для чистішого логу
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;
