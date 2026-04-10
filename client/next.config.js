/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,

  // ESLint не використовується — пропускаємо щоб build не падав
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Image configuration
  images: {
    domains: ['res.cloudinary.com', 'localhost', 'images.unsplash.com', 'via.placeholder.com'],
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
        protocol: 'http',
        hostname: 'localhost',
        port: '8080',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'goodsxp.store',
        pathname: '/**',
      },
    ],
    // ✅ Вимикаємо оптимізацію — Cloudinary/Unsplash вже оптимізовані
    // Це усуває 400 помилки в Docker Alpine де немає sharp
    unoptimized: true,
  },

  // Experimental features for better SSR support
  experimental: {
    optimizePackageImports: ['lucide-react', 'react-hot-toast'],
  },

  // Fix for styled-jsx - transpile packages
  transpilePackages: ['styled-jsx'],

  // Webpack configuration to fix styled-jsx issues
  webpack: (config, { isServer, dev }) => {
    if (!isServer && !dev) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'styled-jsx': require.resolve('styled-jsx'),
      }
    }
    return config
  },
}

module.exports = nextConfig
