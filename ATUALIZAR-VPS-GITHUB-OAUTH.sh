#!/bin/bash

# Script para atualizar correção do GitHub OAuth na VPS
# Execute este script na VPS como root ou com sudo

echo "🚀 Atualizando Deploy Manager na VPS..."
echo ""

# 1. Navegar para o diretório do projeto
cd /root/deploy-manager || exit 1

# 2. Fazer backup do .env atual
echo "📦 Fazendo backup do .env..."
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# 3. Fazer pull das mudanças
echo "📥 Baixando atualizações do GitHub..."
git pull origin main

# 4. Rebuild apenas do frontend (mudança só no frontend)
echo "🔨 Reconstruindo frontend..."
docker-compose -f docker-compose.prod.yml build --no-cache frontend

# 5. Reiniciar serviços
echo "🔄 Reiniciando serviços..."
docker-compose -f docker-compose.prod.yml up -d

# 6. Verificar status
echo ""
echo "✅ Atualização concluída!"
echo ""
echo "📊 Status dos containers:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "📝 Para ver os logs do frontend:"
echo "   docker-compose -f docker-compose.prod.yml logs -f frontend"
echo ""
echo "📝 Para ver os logs do backend:"
echo "   docker-compose -f docker-compose.prod.yml logs -f backend"
echo ""
echo "🔍 Teste a conexão com GitHub em:"
echo "   http://38.242.213.195.sslip.io:8000/dashboard"
