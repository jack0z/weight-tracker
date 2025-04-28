/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  distDir: 'out',
  // Add this to handle dynamic routes in static export
  experimental: {
    missingSuspenseWithCSRError: false
  }
}

module.exports = nextConfig