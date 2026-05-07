// apps/web/next.config.ts
import type { NextConfig } from 'next'

const config: NextConfig = {
  // ── Monorepo package transpilation ───────────────────────────
  transpilePackages: ['@ai-fashion/shared'],

  // ── Image optimization ─────────────────────────────────────────
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/photo-*',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        // Matches all Cloudinary cloud names
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'replicate.delivery',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pbxt.replicate.delivery',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    // 1-hour minimum browser cache for optimized images
    minimumCacheTTL: 3600,
  },

  // ── Bundle optimization ────────────────────────────────────────
  experimental: {
    // Reduces lucide-react and framer-motion bundle significantly
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },

  // ── Production compiler ────────────────────────────────────────
  compiler: {
    // Strip console.log in production; keep console.error and console.warn
    removeConsole: process.env.NODE_ENV === 'production'
      ? { exclude: ['error', 'warn'] }
      : false,
  },

  // ── Build safety — fail fast on type errors ────────────────────
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },

  // ── Security headers (dev + non-Vercel) ───────────────────────
  // Production Vercel headers are in vercel.json (CSP, HSTS, etc.)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },

  // ── Webpack configuration ───────────────────────────────────────
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
      }
    }
    return config
  },
}

export default config
