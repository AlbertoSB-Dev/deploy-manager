#!/bin/bash

# Script de diagnóstico do Traefik
# Verifica configuração e conectividade

PROJECT_NAME=${1:-"sistema-de-teste2"}

echo "🔍 Diagnóstico do Traefik - Projeto: $PROJECT_NAME"
echo "================================================"
echo ""

# 1. Verificar se Traefik está rodando
echo "1️⃣ Verificando Traefik..."
if docker ps | grep -q traefik; then
    echo "✅ Traefik está rodando"
    docker ps --filter "name=traefik" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
else
    echo "❌ Traefik NÃO está rodando"
    exit 1
fi
echo ""

# 2. Verificar redes
echo "2️⃣ Verificando redes Docker..."
echo "Redes disponíveis:"
docker network ls | grep -E "coolify|deploy-manager"
echo ""

# 3. Verificar container do projeto
echo "3️⃣ Verificando container do projeto..."
CONTAINER_ID=$(docker ps -a --filter "name=$PROJECT_NAME" --format "{{.ID}}" | head -n 1)

if [ -z "$CONTAINER_ID" ]; then
    echo "❌ Container não encontrado para projeto: $PROJECT_NAME"
    exit 1
fi

echo "✅ Container encontrado: $CONTAINER_ID"
echo ""

# 4. Verificar status do container
echo "4️⃣ Status do container..."
docker ps -a --filter "id=$CONTAINER_ID" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

# 5. Verificar labels do Traefik
echo "5️⃣ Labels do Traefik no container..."
docker inspect $CONTAINER_ID --format '{{range $key, $value := .Config.Labels}}{{$key}}={{$value}}{{println}}{{end}}' | grep traefik
echo ""

# 6. Verificar redes do container
echo "6️⃣ Redes conectadas ao container..."
docker inspect $CONTAINER_ID --format '{{range $key, $value := .NetworkSettings.Networks}}{{$key}}{{println}}{{end}}'
echo ""

# 7. Verificar se container está na rede correta
echo "7️⃣ Verificando conectividade de rede..."
TRAEFIK_NETWORK=$(docker inspect traefik-proxy --format '{{range $key, $value := .NetworkSettings.Networks}}{{$key}}{{println}}{{end}}' | head -n 1)
CONTAINER_NETWORK=$(docker inspect $CONTAINER_ID --format '{{range $key, $value := .NetworkSettings.Networks}}{{$key}}{{println}}{{end}}' | head -n 1)

echo "Rede do Traefik: $TRAEFIK_NETWORK"
echo "Rede do Container: $CONTAINER_NETWORK"

if [ "$TRAEFIK_NETWORK" = "$CONTAINER_NETWORK" ]; then
    echo "✅ Container está na mesma rede do Traefik"
else
    echo "❌ Container NÃO está na mesma rede do Traefik"
    echo ""
    echo "🔧 Conectando container à rede do Traefik..."
    docker network connect $TRAEFIK_NETWORK $CONTAINER_ID
    echo "✅ Container conectado à rede: $TRAEFIK_NETWORK"
fi
echo ""

# 8. Verificar logs do container
echo "8️⃣ Últimas 10 linhas de log do container..."
docker logs --tail 10 $CONTAINER_ID
echo ""

# 9. Verificar porta do container
echo "9️⃣ Verificando porta da aplicação..."
PORT=$(docker inspect $CONTAINER_ID --format '{{range $key, $value := .Config.Env}}{{println $value}}{{end}}' | grep "^PORT=" | cut -d'=' -f2)
if [ -z "$PORT" ]; then
    echo "⚠️  Variável PORT não definida (usando padrão 3000)"
    PORT=3000
else
    echo "✅ PORT configurada: $PORT"
fi
echo ""

# 10. Testar conectividade interna
echo "🔟 Testando conectividade interna..."
CONTAINER_IP=$(docker inspect $CONTAINER_ID --format '{{range $key, $value := .NetworkSettings.Networks}}{{$value.IPAddress}}{{end}}' | head -n 1)
echo "IP do container: $CONTAINER_IP"

if [ ! -z "$CONTAINER_IP" ]; then
    echo "Testando: http://$CONTAINER_IP:$PORT"
    docker exec traefik-proxy wget -q -O- --timeout=2 http://$CONTAINER_IP:$PORT 2>&1 | head -n 5
fi
echo ""

# 11. Verificar configuração do Traefik
echo "1️⃣1️⃣ Rotas registradas no Traefik..."
echo "Acesse o dashboard: http://SEU_IP:8080"
echo ""

echo "================================================"
echo "✅ Diagnóstico concluído!"
echo ""
echo "💡 Dicas:"
echo "   - Se container não está na rede correta, foi conectado automaticamente"
echo "   - Aguarde 5-10 segundos para Traefik detectar mudanças"
echo "   - Verifique logs do Traefik: docker logs traefik-proxy"
echo "   - Acesse dashboard do Traefik em: http://SEU_IP:8080"
