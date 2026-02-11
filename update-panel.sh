#!/bin/bash

# Script de atualização do painel Ark Deploy
# Uso: ./update-panel.sh

set -e

echo "🚀 Iniciando atualização do painel Ark Deploy..."

# Navegar para o diretório
cd /opt/ark-deploy || { echo "❌ Erro: Diretório /opt/ark-deploy não encontrado"; exit 1; }

echo "📥 Puxando atualizações do Git..."
git pull

echo "🛑 Parando containers..."
docker-compose down

echo "🗑️  Removendo imagem antiga do frontend..."
docker rmi ark-deploy-frontend || true

echo "🧹 Limpando cache Next.js..."
rm -rf frontend/.next

echo "🔨 Reconstruindo frontend (sem cache)..."
docker-compose build --no-cache frontend

echo "✅ Atualização concluída com sucesso!"
echo "💡 Para iniciar os containers, execute: docker-compose up -d"
