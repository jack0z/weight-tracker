/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  // Disable strict mode for searchParams during static export
  experimental: {
    missingSuspenseWithCSRBailout: false
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