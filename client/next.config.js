/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,

  // ESLint не використовується — пропускаємо щоб build не падав
  eslint: {
    ignoreDuringBuilds: true,
  },

  // 🔒 SECURITY: Security headers for all pages
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // 🔒 Permissions-Policy
          { key: 'Permissions-Policy', value: 'geolocation=(), camera=(), microphone=(), payment=(), usb=()' },
          // HSTS only in production (dev uses http)
          ...(process.env.NODE_ENV === 'production'
            ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }]
            : []),
        ],
      },
    ];
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
