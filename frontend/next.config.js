/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Necessário para build standalone (Docker)
  output: 'standalone',
  
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
};

module.exports = nextConfig;
