#!/bin/bash

# Ver logs de erro do backend rapidamente

cd /opt/ark-deploy

echo "📝 Logs do Backend (últimas 100 linhas):"
echo "========================================"
docker-compose -f docker-compose.prod.yml logs --tail=100 backend

echo ""
echo ""
echo "Para ver logs em tempo real:"
echo "  docker-compose -f docker-compose.prod.yml logs -f backend"
