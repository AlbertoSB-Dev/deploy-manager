#!/bin/bash

# Script para atualizar o sistema com monitoramento automático de servidores

echo "🔄 Atualizando sistema com monitoramento de servidores..."
echo ""

cd /root/deploy-manager || exit 1

# 1. Fazer backup do .env
echo "📦 Fazendo backup do .env..."
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# 2. Atualizar código
echo "📥 Baixando atualizações..."
git pull origin main

# 3. Rebuild do backend (nova funcionalidade)
echo "🔨 Reconstruindo backend..."
docker-compose -f docker-compose.prod.yml build --no-cache backend

# 4. Reiniciar serviços
echo "🔄 Reiniciando serviços..."
docker-compose -f docker-compose.prod.yml up -d

# 5. Aguardar backend iniciar
echo "⏳ Aguardando backend iniciar..."
sleep 15

# 6. Verificar logs
echo ""
echo "📝 Últimos logs do backend:"
echo "----------------------------"
docker-compose -f docker-compose.prod.yml logs --tail=30 backend | grep -E "Monitoramento|Verificando status|servidor"

echo ""
echo "✅ Atualização concluída!"
echo ""
echo "📊 O sistema agora verifica o status dos servidores automaticamente a cada 5 minutos."
echo ""
echo "💡 Para ver os logs em tempo real:"
echo "   docker-compose -f docker-compose.prod.yml logs -f backend"
echo ""
echo "🔍 Para forçar verificação manual de um servidor:"
echo "   Clique no botão de 'Testar Conexão' no painel"
