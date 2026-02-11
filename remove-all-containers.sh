#!/bin/bash

# Script para remover TODOS os containers, imagens e volumes do Ark Deploy
# ⚠️  CUIDADO: Isso vai apagar TODOS OS DADOS!

set -e

echo "⚠️  ATENÇÃO: Este script vai remover TUDO do Ark Deploy!"
echo "   - Containers"
echo "   - Imagens Docker"
echo "   - Volumes (incluindo banco de dados)"
echo "   - Cache de build"
echo ""
read -p "Tem certeza? Digite 'SIM' para confirmar: " confirmacao

if [ "$confirmacao" != "SIM" ]; then
    echo "❌ Operação cancelada"
    exit 0
fi

echo ""
echo "🗑️  Removendo tudo..."

# Parar e remover containers
echo "⏹️  Parando containers..."
docker-compose down -v 2>/dev/null || true

# Remover imagens
echo "🗑️  Removendo imagens..."
docker rmi ark-deploy-frontend ark-deploy-backend 2>/dev/null || true

# Remover volumes
echo "🗑️  Removendo volumes..."
docker volume rm ark-deploy_mongodb_data 2>/dev/null || true

# Limpar cache do Docker
echo "🧹 Limpando cache do Docker..."
docker builder prune -af

# Limpar arquivos locais
echo "🧹 Limpando arquivos locais..."
rm -rf frontend/.next
rm -rf frontend/node_modules/.cache
rm -rf backend/dist

echo ""
echo "✅ Tudo removido!"
echo ""
echo "Para reinstalar, execute:"
echo "  docker-compose up -d --build"
echo ""
