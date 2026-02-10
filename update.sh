#!/bin/bash

echo "🔄 Atualizando Ark Deploy..."
echo ""

# Verificar se está no diretório correto
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Erro: Execute este script no diretório deploy-manager"
    exit 1
fi

# 1. Fazer backup do .env
if [ -f ".env" ]; then
    echo "📦 Fazendo backup do .env..."
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
fi

# 2. Baixar atualizações
echo "⬇️  Baixando atualizações do GitHub..."
git pull origin main

if [ $? -ne 0 ]; then
    echo "❌ Erro ao fazer git pull"
    exit 1
fi

# 3. Parar containers
echo "🛑 Parando containers..."
docker-compose down

# 4. Rebuild e iniciar
echo "🐳 Reconstruindo e iniciando containers..."
docker-compose up -d --build

# 5. Aguardar containers iniciarem
echo "⏳ Aguardando containers iniciarem..."
sleep 10

# 6. Verificar status
echo "📊 Status dos containers:"
docker-compose ps

echo ""
echo "✅ Atualização concluída!"
echo ""
echo "📍 Acesse: http://$(curl -s ifconfig.me):8000"
echo ""
