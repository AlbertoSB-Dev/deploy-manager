#!/bin/bash

# Script de diagnóstico completo para o problema 502

echo "🔍 DIAGNÓSTICO COMPLETO DO BACKEND"
echo "===================================="
echo ""

cd /opt/ark-deploy

# 1. Status dos containers
echo "1️⃣ STATUS DOS CONTAINERS:"
echo "-------------------------"
docker-compose -f docker-compose.prod.yml ps
echo ""

# 2. Logs do backend (últimas 100 linhas)
echo "2️⃣ LOGS DO BACKEND:"
echo "------------------"
docker-compose -f docker-compose.prod.yml logs --tail=100 backend
echo ""

# 3. Verificar se o backend está respondendo DENTRO do container
echo "3️⃣ TESTE DE CONEXÃO INTERNA (dentro do container):"
echo "---------------------------------------------------"
docker exec ark-deploy-backend-prod wget -q -O- http://localhost:8001/health 2>&1 || echo "❌ Backend não responde internamente"
echo ""

# 4. Verificar se o backend está respondendo na rede Docker
echo "4️⃣ TESTE DE CONEXÃO NA REDE DOCKER:"
echo "-----------------------------------"
docker exec ark-deploy-frontend-prod wget -q -O- http://backend:8001/health 2>&1 || echo "❌ Backend não responde na rede Docker"
echo ""

# 5. Verificar portas abertas no host
echo "5️⃣ PORTAS ABERTAS NO HOST:"
echo "--------------------------"
netstat -tlnp | grep -E ':(8000|8001)' || echo "❌ Portas 8000/8001 não estão abertas"
echo ""

# 6. Testar conexão do host para o backend
echo "6️⃣ TESTE DE CONEXÃO DO HOST:"
echo "----------------------------"
curl -s http://localhost:8001/health || echo "❌ Backend não responde do host"
echo ""

# 7. Verificar arquivo .env
echo "7️⃣ ARQUIVO .ENV:"
echo "----------------"
if [ -f .env ]; then
    echo "✅ Arquivo .env existe"
    echo "Variáveis críticas:"
    grep -E "^(JWT_SECRET|ENCRYPTION_KEY|MONGO_PASSWORD|FRONTEND_URL|NEXT_PUBLIC_API_URL)=" .env | sed 's/=.*/=***/'
else
    echo "❌ Arquivo .env NÃO existe!"
fi
echo ""

# 8. Verificar processos dentro do container backend
echo "8️⃣ PROCESSOS NO CONTAINER BACKEND:"
echo "----------------------------------"
docker exec ark-deploy-backend-prod ps aux | grep -E '(node|ts-node)' || echo "❌ Nenhum processo Node rodando"
echo ""

# 9. Verificar uso de recursos
echo "9️⃣ USO DE RECURSOS:"
echo "-------------------"
docker stats --no-stream ark-deploy-backend-prod ark-deploy-frontend-prod ark-deploy-mongodb-prod
echo ""

# 10. Verificar logs do Nginx (se existir)
echo "🔟 LOGS DO NGINX/TRAEFIK:"
echo "------------------------"
if docker ps | grep -q nginx; then
    docker logs nginx --tail=50 2>&1 | grep -i error || echo "Sem erros no Nginx"
elif docker ps | grep -q traefik; then
    docker logs traefik --tail=50 2>&1 | grep -i error || echo "Sem erros no Traefik"
else
    echo "⚠️  Nginx/Traefik não encontrado"
fi
echo ""

# 11. Verificar conectividade MongoDB
echo "1️⃣1️⃣ TESTE MONGODB:"
echo "------------------"
docker exec ark-deploy-mongodb-prod mongosh -u admin -p vQO20N8X8k41oRkAUWAEnw== --authenticationDatabase admin --eval "db.adminCommand('ping')" 2>&1 || echo "❌ MongoDB não responde"
echo ""

# 12. Verificar se há erros de TypeScript
echo "1️⃣2️⃣ ERROS DE COMPILAÇÃO:"
echo "------------------------"
docker-compose -f docker-compose.prod.yml logs backend | grep -i "error" | tail -20 || echo "✅ Sem erros de compilação"
echo ""

echo ""
echo "📋 RESUMO E PRÓXIMOS PASSOS:"
echo "============================"
echo ""
echo "Se o backend NÃO está respondendo internamente (teste 3):"
echo "  → O problema é no código ou nas variáveis de ambiente"
echo "  → Verifique os logs acima para erros específicos"
echo ""
echo "Se o backend responde internamente MAS NÃO na rede Docker (teste 4):"
echo "  → Problema de rede entre containers"
echo "  → Execute: docker network inspect ark-deploy_ark-deploy-network"
echo ""
echo "Se o backend responde na rede Docker MAS NÃO do host (teste 6):"
echo "  → Problema no mapeamento de portas"
echo "  → Verifique se a porta 8001 está realmente mapeada"
echo ""
echo "Se tudo responde MAS ainda tem 502:"
echo "  → Problema no Nginx/Traefik"
echo "  → Verifique a configuração do proxy reverso"
echo ""
