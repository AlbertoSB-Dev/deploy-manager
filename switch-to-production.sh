#!/bin/bash

echo "🔄 Mudando para modo de produção..."
echo ""

cd /opt/ark-deploy

# Parar containers atuais
echo "⏹️  Parando containers em modo dev..."
docker-compose down

# Usar docker-compose de produção
echo "🚀 Iniciando em modo produção..."
docker-compose -f docker-compose.prod.yml up -d --build

# Aguardar containers iniciarem
echo "⏳ Aguardando containers..."
sleep 20

# Verificar status
echo "📊 Status dos containers:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "✅ Sistema agora está em modo PRODUÇÃO!"
echo ""
echo "🌐 Acesse: http://painel.38.242.213.195.sslip.io"
echo ""
echo "📝 Para ver logs:"
echo "   docker-compose -f docker-compose.prod.yml logs -f"
echo ""
