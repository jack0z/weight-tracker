/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Disable server components and static generation
  experimental: {
    appDir: true,
  },
  // Skip specific paths during static generation
  exportPathMap: async function() {
    return {
      '/': { page: '/' }
    };
  }
}

module.exports = nextConfig