/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  distDir: 'out',
  // Add static HTML shell
  generateStaticParams: async () => {
    return [{
      params: { path: [] }
    }];
  }
}

module.exports = nextConfig