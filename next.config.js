/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
  },
  output: 'standalone',
}

require('dotenv').config()

module.exports = nextConfig;