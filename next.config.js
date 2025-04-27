/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
  },
}

require('dotenv').config()

module.exports = nextConfig;