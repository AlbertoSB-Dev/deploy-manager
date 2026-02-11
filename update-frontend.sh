#!/bin/bash

# 🚀 Ark Deploy - Atualizar Frontend com Logo PNG
# Execute no servidor: bash update-frontend.sh

set -e

echo "🔄 Atualizando Ark Deploy Frontend..."
echo ""

# Ir para o diretório do projeto
cd /opt/ark-deploy || exit 1

# Fazer pull das mudanças
echo "📥 Puxando mudanças do repositório..."
git pull origin main || git pull

echo ""
echo "🔨 Reconstruindo frontend..."
docker-compose build --no-cache frontend

echo ""
echo "🚀 Reiniciando frontend..."
docker-compose up -d frontend

echo ""
echo "⏳ Aguardando frontend iniciar..."
sleep 5

# Verificar se está rodando
if docker-compose ps frontend | grep -q "Up"; then
    echo "✅ Frontend atualizado com sucesso!"
    echo "🌐 Acesse: http://painel.$(hostname -I | awk '{print $1}').sslip.io"
else
    echo "❌ Erro ao iniciar frontend"
    docker-compose logs frontend --tail=20
    exit 1
fi
