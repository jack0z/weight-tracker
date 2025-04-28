/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  distDir: 'out',
  // Add custom 404 page
  async redirects() {
    return [
      {
        source: '/share/:id',
        destination: '/',
        permanent: false,
      },
    ];
  }
}

module.exports = nextConfig