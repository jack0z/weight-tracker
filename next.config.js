/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Add this to prevent pre-rendering
  experimental: {
    // This prevents pre-rendering which causes the document not defined error
    appDir: true,
  }
}

module.exports = nextConfig