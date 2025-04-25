/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  // Optional: configure base path if deploying to a subdirectory
  // basePath: '/weight-tracker',
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig 