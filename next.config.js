/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
  },
  basePath: '',
  experimental: {
    appDir: true,
  },
  assetPrefix: './',
  webpack: (config, { isServer }) => {
    if (!isServer) {
      console.log('Webpack client config:', config.output)
    }
    return config
  }
}

require('dotenv').config()

module.exports = nextConfig;