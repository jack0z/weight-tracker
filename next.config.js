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
  // Completely disable app directory scanning
  useFileSystemPublicRoutes: true,
  pageExtensions: ['js', 'jsx']
}

module.exports = nextConfig 