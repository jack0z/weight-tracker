/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
  },
  // Add basePath configuration
  basePath: '',
  // Disable server-side features
  experimental: {
    appDir: true,
  },
  // Configure asset prefix for Netlify
  assetPrefix: process.env.NODE_ENV === 'production' ? '/' : '',
}

require('dotenv').config()

module.exports = nextConfig;