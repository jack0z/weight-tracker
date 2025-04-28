/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Disable API routes since we're using Netlify Functions
  rewrites: async () => [],
}

module.exports = nextConfig