#!/bin/bash

# Ver logs do frontend

cd /opt/ark-deploy

echo "📝 Logs do Frontend (últimas 100 linhas):"
echo "=========================================="
docker-compose -f docker-compose.prod.yml logs --tail=100 frontend

echo ""
echo ""
echo "🔍 Testando frontend internamente:"
echo "===================================="
docker exec ark-deploy-frontend-prod wget -q -O- http://localhost:8000 2>&1 | head -20 || echo "❌ Frontend não responde"

echo ""
echo ""
echo "📊 Status do healthcheck do frontend:"
echo "====================================="
docker inspect ark-deploy-frontend-prod | grep -A 10 "Health"

echo ""
echo ""
echo "Para ver logs em tempo real:"
echo "  docker-compose -f docker-compose.prod.yml logs -f frontend"
