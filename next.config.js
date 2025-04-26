/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  output: 'export',
  distDir: 'out',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  // Set base path to empty for Netlify compatibility
  basePath: '',
  // Add asset prefix for production
  assetPrefix: './',
  // Disable experimental features
  experimental: {
    missingSuspenseWithCSRBailout: false,
    appDir: false
  },
  // Ensure _redirects file is copied to the output directory
  async redirects() {
    return [
      {
        source: '/api/:path*',
        destination: '/.netlify/functions/:path*',
        permanent: true,
      }
    ];
  }
}

module.exports = nextConfig 