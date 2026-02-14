#!/bin/bash

# Script para debugar o GitHub OAuth na VPS

echo "🔍 Diagnóstico do GitHub OAuth"
echo "================================"
echo ""

# 1. Verificar se os containers estão rodando
echo "📦 Status dos containers:"
docker-compose -f docker-compose.prod.yml ps
echo ""

# 2. Ver últimas 50 linhas dos logs do backend
echo "📝 Últimos logs do BACKEND:"
echo "----------------------------"
docker-compose -f docker-compose.prod.yml logs --tail=50 backend
echo ""

# 3. Ver últimas 30 linhas dos logs do frontend
echo "📝 Últimos logs do FRONTEND:"
echo "----------------------------"
docker-compose -f docker-compose.prod.yml logs --tail=30 frontend
echo ""

# 4. Verificar configurações do GitHub no MongoDB
echo "🔍 Configurações do GitHub no MongoDB:"
echo "--------------------------------------"
docker exec deploy-manager-mongodb-1 mongosh -u admin -p vQO20N8X8k41oRkAUWAEnw== --authenticationDatabase admin ark-deploy --eval "db.systemsettings.findOne({}, {githubClientId: 1, githubClientSecret: 1, githubCallbackUrl: 1})" --quiet
echo ""

# 5. Testar rota de inicialização do OAuth
echo "🧪 Testando rota /api/github/auth/github:"
echo "-----------------------------------------"
curl -s http://localhost:8001/api/github/auth/github | jq .
echo ""

echo "✅ Diagnóstico concluído!"
echo ""
echo "💡 Próximos passos:"
echo "   1. Verifique se o githubClientId está configurado no MongoDB"
echo "   2. Verifique se o githubCallbackUrl está correto"
echo "   3. Se houver erro 400, veja os logs do backend acima"
