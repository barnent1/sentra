/** @type {import('next').NextConfig} */
const nextConfig = {
  // Web app deployment: use Next.js server-side rendering
  // (no output: 'export' for proper server deployment)

  // Enable latest features
  reactStrictMode: true,

  // ESLint: Don't fail build on warnings (only errors)
  eslint: {
    ignoreDuringBuilds: false,  // Still run ESLint
    dirs: ['src'],              // Only check src directory
  },

  // Cache bust for jose dependency fix
  generateBuildId: async () => {
    return `build-${Date.now()}`
  },

  // Note: swcMinify is now default in Next.js 15+
  // Note: PPR requires canary version - enable in future when stable

  // Optimize images for modern formats
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.gravatar.com',
        pathname: '/avatar/**',
      },
    ],
  },

  // Security and performance headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
        ],
      },
      {
        // Cache static assets aggressively
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
