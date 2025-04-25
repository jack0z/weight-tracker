/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  // Static generation config
  exportPathMap: async function(
    defaultPathMap,
    { dev, dir, outDir, distDir, buildId }
  ) {
    return {
      '/': { page: '/' },
      '/share-fallback': { page: '/share-fallback' },
      // Pre-rendered demo shares as both paths and query params for compatibility
      '/share/demo_share': { 
        page: '/share/[id]', 
        query: { id: 'demo_share' } 
      },
      '/share/demo_permalink': { 
        page: '/share/[id]', 
        query: { id: 'demo_permalink' } 
      }
    };
  }
}

module.exports = nextConfig 