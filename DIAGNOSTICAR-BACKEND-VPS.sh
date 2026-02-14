#!/bin/bash

# Script para diagnosticar problema do backend na VPS

echo "🔍 Diagnóstico do Backend"
echo "========================="
echo ""

cd /opt/ark-deploy

# 1. Ver logs do backend
echo "📝 Logs do backend (últimas 50 linhas):"
echo "----------------------------------------"
docker-compose -f docker-compose.prod.yml logs --tail=50 backend
echo ""

# 2. Verificar se o container está rodando
echo "📦 Status do container:"
echo "----------------------"
docker-compose -f docker-compose.prod.yml ps backend
echo ""

# 3. Tentar acessar o healthcheck
echo "🏥 Testando healthcheck:"
echo "-----------------------"
docker exec ark-deploy-backend-prod wget -q -O- http://localhost:8001/health || echo "❌ Healthcheck falhou"
echo ""

# 4. Verificar variáveis de ambiente
echo "🔧 Variáveis de ambiente críticas:"
echo "----------------------------------"
docker exec ark-deploy-backend-prod sh -c 'echo "JWT_SECRET: ${JWT_SECRET:0:10}..."'
docker exec ark-deploy-backend-prod sh -c 'echo "ENCRYPTION_KEY: ${ENCRYPTION_KEY:0:10}..."'
docker exec ark-deploy-backend-prod sh -c 'echo "MONGODB_URI: $MONGODB_URI"'
docker exec ark-deploy-backend-prod sh -c 'echo "PORT: $PORT"'
echo ""

# 5. Verificar se o processo Node está rodando
echo "⚙️ Processos rodando no container:"
echo "----------------------------------"
docker exec ark-deploy-backend-prod ps aux
echo ""

# 6. Tentar conectar no MongoDB
echo "🗄️ Testando conexão com MongoDB:"
echo "--------------------------------"
docker exec ark-deploy-mongodb-prod mongosh -u admin -p vQO20N8X8k41oRkAUWAEnw== --authenticationDatabase admin --eval "db.adminCommand('ping')" || echo "❌ MongoDB não acessível"
echo ""

# 7. Verificar arquivo .env
echo "📄 Verificando .env na raiz:"
echo "----------------------------"
if [ -f .env ]; then
    echo "✅ Arquivo .env existe"
    echo "Variáveis configuradas:"
    grep -E "^(JWT_SECRET|ENCRYPTION_KEY|MONGODB_URI|PORT)=" .env | sed 's/=.*/=***/'
else
    echo "❌ Arquivo .env NÃO existe!"
fi
echo ""

# 8. Sugestões
echo "💡 Possíveis soluções:"
echo "---------------------"
echo "1. Se JWT_SECRET ou ENCRYPTION_KEY estão com valores padrão:"
echo "   → Edite o arquivo .env e configure valores únicos"
echo ""
echo "2. Se o MongoDB não está acessível:"
echo "   → docker-compose -f docker-compose.prod.yml restart mongodb"
echo ""
echo "3. Se o backend não inicia:"
echo "   → Verifique os logs acima para erros específicos"
echo ""
echo "4. Para reiniciar tudo:"
echo "   → docker-compose -f docker-compose.prod.yml down"
echo "   → docker-compose -f docker-compose.prod.yml up -d"
echo ""
