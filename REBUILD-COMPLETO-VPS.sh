#!/bin/bash

# Script para rebuild completo do sistema na VPS

echo "🔄 REBUILD COMPLETO DO SISTEMA"
echo "==============================="
echo ""

cd /opt/ark-deploy

# 1. Parar todos os containers
echo "1️⃣ Parando containers..."
docker-compose -f docker-compose.prod.yml down
echo "✅ Containers parados"
echo ""

# 2. Remover imagens antigas
echo "2️⃣ Removendo imagens antigas..."
docker rmi ark-deploy-backend:latest 2>/dev/null || echo "Imagem backend não existe"
docker rmi ark-deploy-frontend:latest 2>/dev/null || echo "Imagem frontend não existe"
echo "✅ Imagens removidas"
echo ""

# 3. Limpar cache do Docker
echo "3️⃣ Limpando cache do Docker..."
docker builder prune -f
echo "✅ Cache limpo"
echo ""

# 4. Verificar arquivo .env
echo "4️⃣ Verificando arquivo .env..."
if [ ! -f .env ]; then
    echo "❌ ERRO: Arquivo .env não existe!"
    echo "Crie o arquivo .env com as variáveis necessárias antes de continuar"
    exit 1
fi

# Verificar variáveis críticas
MISSING_VARS=""
for VAR in JWT_SECRET ENCRYPTION_KEY MONGO_PASSWORD FRONTEND_URL NEXT_PUBLIC_API_URL; do
    if ! grep -q "^${VAR}=" .env; then
        MISSING_VARS="${MISSING_VARS} ${VAR}"
    fi
done

if [ -n "$MISSING_VARS" ]; then
    echo "❌ ERRO: Variáveis faltando no .env:${MISSING_VARS}"
    exit 1
fi

echo "✅ Arquivo .env OK"
echo ""

# 5. Build com --no-cache
echo "5️⃣ Fazendo build (isso pode demorar 5-10 minutos)..."
docker-compose -f docker-compose.prod.yml build --no-cache
if [ $? -ne 0 ]; then
    echo "❌ ERRO no build!"
    exit 1
fi
echo "✅ Build concluído"
echo ""

# 6. Subir containers
echo "6️⃣ Subindo containers..."
docker-compose -f docker-compose.prod.yml up -d
echo "✅ Containers iniciados"
echo ""

# 7. Aguardar 30 segundos
echo "7️⃣ Aguardando 30 segundos para containers iniciarem..."
sleep 30
echo ""

# 8. Verificar status
echo "8️⃣ Status dos containers:"
docker-compose -f docker-compose.prod.yml ps
echo ""

# 9. Testar backend
echo "9️⃣ Testando backend..."
sleep 5
curl -s http://localhost:8001/health && echo "✅ Backend respondendo!" || echo "❌ Backend não responde"
echo ""

# 10. Mostrar logs
echo "🔟 Logs do backend (últimas 50 linhas):"
docker-compose -f docker-compose.prod.yml logs --tail=50 backend
echo ""

echo "✅ REBUILD COMPLETO FINALIZADO!"
echo ""
echo "Acesse: http://38.242.213.195:8000"
echo ""
