/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Ignorar erros de TypeScript e ESLint durante build em produção
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Configurar root do projeto para evitar warning de múltiplos lockfiles
  outputFileTracingRoot: require('path').join(__dirname, '../'),
  
  // Configurações de imagem
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
};

module.exports = nextConfig;
