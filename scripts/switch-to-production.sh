#!/bin/bash

# Script para mudar o Ark Deploy para modo produção
# Este script remove todos os containers, imagens e cache, e reconstrói tudo em modo produção

set -e

echo "🔄 Mudando Ark Deploy para modo PRODUÇÃO..."
echo ""

# Verificar se está no diretório correto
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Erro: docker-compose.yml não encontrado"
    echo "Execute este script no diretório raiz do projeto"
    exit 1
fi

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
echo "   Build configurado para ignorar erros de TypeScript"
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
echo "   - http://${SERVER_IP:-localhost}:8000"
echo "   - http://painel.${SERVER_IP:-localhost}.sslip.io"
echo ""
echo "📊 Para ver os logs em tempo real:"
echo "   docker-compose logs -f"
echo ""
echo "🔍 Para verificar se está em produção:"
echo "   docker-compose logs frontend | grep -i 'mode\\|dev\\|production'"
echo "   docker-compose logs backend | grep -i 'mode\\|dev\\|production'"
echo ""
