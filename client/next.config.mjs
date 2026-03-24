/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,

  // ESLint/TypeScript - ignore during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // Image configuration
  images: {
    domains: ['res.cloudinary.com', 'localhost', 'images.unsplash.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'goodsxp.store',
        pathname: '/uploads/**',
      },
    ],
    unoptimized: false,
  },

  // Experimental features for better SSR support
  experimental: {
    // Fix for styled-jsx hydration issues
    optimizePackageImports: ['lucide-react', 'react-hot-toast'],
  },
}

export default nextConfig
