#!/bin/bash

# Script para atualizar o sistema do painel Ark Deploy
# Uso: ./update-system.sh

set -e  # Exit on error

echo "🚀 Iniciando atualização do sistema Ark Deploy..."
echo ""

# Verificar se estamos no diretório correto
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Erro: docker-compose.yml não encontrado"
    echo "Execute este script a partir do diretório raiz do projeto (/opt/ark-deploy)"
    exit 1
fi

echo "📥 Fazendo pull das alterações..."
git pull

echo ""
echo "🛑 Parando containers..."
docker-compose down

echo ""
echo "🗑️  Removendo imagem do frontend..."
docker rmi ark-deploy-frontend || true

echo ""
echo "🧹 Limpando cache do Next.js..."
rm -rf frontend/.next

echo ""
echo "✅ Atualização concluída com sucesso!"
echo ""
echo "Próximos passos:"
echo "  1. Execute: docker-compose up -d"
echo "  2. Verifique os logs: docker-compose logs -f"
