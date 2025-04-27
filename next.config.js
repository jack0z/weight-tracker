/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

require('dotenv').config();

module.exports = {
  reactStrictMode: true,
};

module.exports = {
  env: {
    MONGO_URI: process.env.MONGO_URI,
  },
};

module.exports = nextConfig 