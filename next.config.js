/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        'timers/promises': false
      }
    }
    return config
  },
  // Add PostCSS config
  postcss: {
    plugins: [
      'tailwindcss',
      'autoprefixer',
    ],
  }
}

module.exports = nextConfig