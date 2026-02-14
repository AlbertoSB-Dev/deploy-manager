#!/bin/bash

# Ver logs do backend em tempo real
# Execute na VPS e depois tente conectar ao GitHub no navegador

echo "📝 Mostrando logs do backend em tempo real..."
echo "   Pressione Ctrl+C para sair"
echo ""

cd /root/deploy-manager
docker-compose -f docker-compose.prod.yml logs -f backend
