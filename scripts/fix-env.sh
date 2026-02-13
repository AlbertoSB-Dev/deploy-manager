#!/bin/bash

echo "🔧 Corrigindo configuração do Ark Deploy..."
echo ""

cd /opt/ark-deploy

# Detectar IP
SERVER_IP=$(grep SERVER_IP .env | cut -d= -f2)
if [ -z "$SERVER_IP" ]; then
    SERVER_IP=$(curl -4 -s ifconfig.me)
    echo "✅ IP detectado: $SERVER_IP"
fi

# Adicionar NEXT_PUBLIC_API_URL se não existir
if ! grep -q "NEXT_PUBLIC_API_URL" .env; then
    echo "" >> .env
    echo "# Frontend API URL" >> .env
    echo "NEXT_PUBLIC_API_URL=http://$SERVER_IP:8001/api" >> .env
    echo "✅ NEXT_PUBLIC_API_URL adicionado"
fi

# Atualizar código
echo "📥 Atualizando código..."
git pull

# Reconstruir containers
echo "🐳 Reconstruindo containers..."
docker-compose down
docker-compose up -d --build

# Aguardar
echo "⏳ Aguardando containers iniciarem..."
sleep 20

# Criar admin
echo "👤 Criando usuário admin..."
docker-compose exec -T backend node scripts/create-admin.js || true

echo ""
echo "✅ Correção concluída!"
echo ""
echo "🌐 Acesse:"
echo "   http://$SERVER_IP:8000"
echo ""
echo "🔑 Login:"
echo "   Email: admin@admin.com"
echo "   Senha: admin123"
echo ""
