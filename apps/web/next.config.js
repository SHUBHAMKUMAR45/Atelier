/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@ai-fashion/shared'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'replicate.delivery' },
    ],
  },
  experimental: {
    typedRoutes: false,
  },
}

module.exports = nextConfig
