/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
  },
  assetPrefix: '/',
  basePath: '',
  experimental: {
    appDir: true,
  }
}

require('dotenv').config()

module.exports = nextConfig