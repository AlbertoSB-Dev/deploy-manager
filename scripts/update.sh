#!/bin/bash

# Script para atualizar Ark Deploy
# Use: ./UPDATE.sh

set -e

cd /opt/ark-deploy

echo "📥 Atualizando código..."
git pull

echo "⏹️  Parando containers..."
docker-compose down

echo "🗑️  Removendo imagens antigas..."
docker rmi ark-deploy-frontend ark-deploy-backend 2>/dev/null || true

echo "🧹 Limpando cache..."
docker builder prune -af
rm -rf frontend/.next backend/dist 2>/dev/null || true

echo "🔨 Reconstruindo em modo PRODUÇÃO..."
docker-compose build --no-cache --pull

echo "🚀 Iniciando containers..."
docker-compose up -d

echo ""
echo "✅ Atualização concluída!"
echo ""
echo "🌐 Acesse: http://38.242.213.195:8000"
echo ""
docker-compose logs --tail=20 frontend
docker-compose logs --tail=20 backend
