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
  
  // Desabilitar pre-render estático completamente
  staticPageGenerationTimeout: 0,
  
  // Configurar root do projeto para evitar warning de múltiplos lockfiles
  outputFileTracingRoot: require('path').join(__dirname, '../'),
  
  // Configurações de imagem
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
  
  // Desabilitar ISR e pre-render
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
};

module.exports = nextConfig;
