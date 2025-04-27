/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        'timers/promises': false,
        crypto: false,
        stream: false,
        buffer: false
      }
    }
    return config
  },
  // Add env variables that should be available at build time
  env: {
    MONGODB_URI: process.env.MONGODB_URI
  }
}

module.exports = nextConfig