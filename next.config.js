/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  // Disable strict mode for searchParams during static export
  experimental: {
    missingSuspenseWithCSRBailout: false
  }
}

module.exports = nextConfig 