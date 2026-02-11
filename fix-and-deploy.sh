#!/bin/bash

# Script para resolver conflitos git e colocar em produção
# Este script resolve conflitos locais e prepara o sistema para produção

set -e

echo "🔧 Resolvendo conflitos e preparando para produção..."
echo ""

# Verificar se está no diretório correto
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Erro: docker-compose.yml não encontrado"
    echo "Execute este script no diretório raiz do projeto"
    exit 1
fi

# Stash das mudanças locais
echo "📦 Salvando mudanças locais..."
git stash

# Pull das atualizações
echo "📥 Puxando atualizações do repositório..."
git pull

# Parar todos os containers
echo "⏹️  Parando containers..."
docker-compose down

# Remover imagens antigas
echo "🗑️  Removendo imagens antigas..."
docker rmi ark-deploy-frontend ark-deploy-backend 2>/dev/null || true

# Limpar cache do Docker
echo "🧹 Limpando cache do Docker..."
docker builder prune -af

# Limpar cache do Next.js no frontend
echo "🧹 Limpando cache do Next.js..."
rm -rf frontend/.next
rm -rf frontend/node_modules/.cache

# Limpar build do backend
echo "🧹 Limpando build do backend..."
rm -rf backend/dist

# Rebuild com --no-cache para garantir build limpo
echo "🔨 Reconstruindo imagens em modo PRODUÇÃO (isso pode demorar)..."
docker-compose build --no-cache --pull

# Iniciar containers
echo "🚀 Iniciando containers em modo PRODUÇÃO..."
docker-compose up -d

# Aguardar containers iniciarem
echo "⏳ Aguardando containers iniciarem..."
sleep 10

# Mostrar logs
echo ""
echo "📋 Logs dos containers:"
echo ""
docker-compose logs --tail=50

echo ""
echo "✅ Sistema em modo PRODUÇÃO!"
echo ""
echo "🌐 Acesse o painel em:"
echo "   - http://38.242.213.195:8000"
echo "   - http://painel.38.242.213.195.sslip.io"
echo ""
echo "📊 Para ver os logs em tempo real:"
echo "   docker-compose logs -f"
echo ""
