/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disabling reactStrictMode to avoid effects being called twice in development
  reactStrictMode: false,
  
  // For Netlify static export
  output: 'export',
  
  // Output directory for the static build
  distDir: 'out',
  
  // Base path for the application (empty for Netlify)
  basePath: '',
  
  // Asset prefix for relative paths (required for static hosting)
  assetPrefix: './',
  
  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },
  
  // Disable the App Router completely
  experimental: {
    appDir: false,
  },
  
  // Generate static paths for specific routes
  exportPathMap: async function () {
    return {
      '/': { page: '/' },
      '/404': { page: '/404' },
    };
  },
  
  // Webpack configuration to handle relative paths
  webpack: (config) => {
    // Add publicPath configuration for assets
    config.output.publicPath = './';
    return config;
  },
}

module.exports = nextConfig 