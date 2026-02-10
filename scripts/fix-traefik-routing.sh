#!/bin/bash

# Script para corrigir roteamento do Traefik
# Conecta container à rede correta e verifica labels

PROJECT_NAME=${1:-"sistema-de-teste2"}
DOMAIN=${2:-"sistemadeteste2.38.242.213.195.sslip.io"}
PORT=${3:-9001}

echo "🔧 Corrigindo roteamento do Traefik"
echo "Projeto: $PROJECT_NAME"
echo "Domínio: $DOMAIN"
echo "Porta: $PORT"
echo "================================================"
echo ""

# 1. Encontrar container
echo "1️⃣ Procurando container..."
CONTAINER_ID=$(docker ps --filter "name=$PROJECT_NAME" --format "{{.ID}}" | head -n 1)

if [ -z "$CONTAINER_ID" ]; then
    echo "❌ Container não encontrado: $PROJECT_NAME"
    echo "Containers disponíveis:"
    docker ps --format "table {{.Names}}\t{{.ID}}\t{{.Status}}"
    exit 1
fi

echo "✅ Container encontrado: $CONTAINER_ID"
CONTAINER_NAME=$(docker ps --filter "id=$CONTAINER_ID" --format "{{.Names}}")
echo "Nome: $CONTAINER_NAME"
echo ""

# 2. Verificar se Traefik está rodando
echo "2️⃣ Verificando Traefik..."
if ! docker ps | grep -q traefik; then
    echo "❌ Traefik não está rodando!"
    exit 1
fi
echo "✅ Traefik rodando"
echo ""

# 3. Detectar rede do Traefik
echo "3️⃣ Detectando rede do Traefik..."
TRAEFIK_NETWORK=$(docker inspect traefik-proxy --format '{{range $key, $value := .NetworkSettings.Networks}}{{$key}}{{end}}' | head -c -1)

if [ -z "$TRAEFIK_NETWORK" ]; then
    echo "❌ Não foi possível detectar rede do Traefik"
    exit 1
fi

echo "✅ Rede do Traefik: $TRAEFIK_NETWORK"
echo ""

# 4. Verificar redes do container
echo "4️⃣ Verificando redes do container..."
CONTAINER_NETWORKS=$(docker inspect $CONTAINER_ID --format '{{range $key, $value := .NetworkSettings.Networks}}{{$key}} {{end}}')
echo "Redes atuais: $CONTAINER_NETWORKS"

if [[ ! $CONTAINER_NETWORKS =~ $TRAEFIK_NETWORK ]]; then
    echo "⚠️  Container NÃO está na rede do Traefik"
    echo "🔧 Conectando à rede: $TRAEFIK_NETWORK..."
    docker network connect $TRAEFIK_NETWORK $CONTAINER_ID
    echo "✅ Container conectado!"
else
    echo "✅ Container já está na rede do Traefik"
fi
echo ""

# 5. Verificar labels do Traefik
echo "5️⃣ Verificando labels do Traefik..."
LABELS=$(docker inspect $CONTAINER_ID --format '{{range $key, $value := .Config.Labels}}{{if eq $key "traefik.enable"}}{{$key}}={{$value}}{{end}}{{end}}')

if [ -z "$LABELS" ]; then
    echo "❌ Container NÃO tem labels do Traefik!"
    echo ""
    echo "🔧 Recriando container com labels corretos..."
    
    # Gerar nome limpo para router
    ROUTER_NAME=$(echo "$PROJECT_NAME" | sed 's/[^a-z0-9]//g')
    
    # Parar container atual
    docker stop $CONTAINER_ID
    
    # Pegar imagem
    IMAGE=$(docker inspect $CONTAINER_ID --format '{{.Config.Image}}')
    
    # Pegar variáveis de ambiente
    ENV_VARS=$(docker inspect $CONTAINER_ID --format '{{range .Config.Env}}{{println .}}{{end}}' | grep -v "^PATH=" | sed 's/^/-e /' | tr '\n' ' ')
    
    # Remover container antigo
    docker rm $CONTAINER_ID
    
    # Criar novo container com labels
    NEW_CONTAINER=$(docker run -d \
      --name $CONTAINER_NAME \
      --network $TRAEFIK_NETWORK \
      --label "traefik.enable=true" \
      --label "traefik.http.routers.$ROUTER_NAME.rule=Host(\`$DOMAIN\`)" \
      --label "traefik.http.routers.$ROUTER_NAME.entrypoints=web" \
      --label "traefik.http.services.$ROUTER_NAME.loadbalancer.server.port=$PORT" \
      --label "traefik.docker.network=$TRAEFIK_NETWORK" \
      --restart unless-stopped \
      $ENV_VARS \
      $IMAGE)
    
    echo "✅ Container recriado: $NEW_CONTAINER"
    CONTAINER_ID=$NEW_CONTAINER
else
    echo "✅ Labels encontrados:"
    docker inspect $CONTAINER_ID --format '{{range $key, $value := .Config.Labels}}{{if or (eq $key "traefik.enable") (eq $key "traefik.http.routers.sistemadeteste2.rule") (eq $key "traefik.http.services.sistemadeteste2.loadbalancer.server.port")}}  {{$key}}={{$value}}{{println}}{{end}}{{end}}'
fi
echo ""

# 6. Verificar status do container
echo "6️⃣ Verificando status..."
STATUS=$(docker inspect $CONTAINER_ID --format '{{.State.Status}}')
if [ "$STATUS" != "running" ]; then
    echo "❌ Container não está rodando: $STATUS"
    echo "Logs:"
    docker logs --tail 20 $CONTAINER_ID
    exit 1
fi
echo "✅ Container rodando"
echo ""

# 7. Testar conectividade interna
echo "7️⃣ Testando conectividade interna..."
CONTAINER_IP=$(docker inspect $CONTAINER_ID --format '{{range $key, $value := .NetworkSettings.Networks}}{{if eq $key "'$TRAEFIK_NETWORK'"}}{{$value.IPAddress}}{{end}}{{end}}')
echo "IP do container na rede $TRAEFIK_NETWORK: $CONTAINER_IP"

if [ ! -z "$CONTAINER_IP" ]; then
    echo "Testando: http://$CONTAINER_IP:$PORT"
    RESPONSE=$(docker exec traefik-proxy wget -q -O- --timeout=2 http://$CONTAINER_IP:$PORT 2>&1 | head -n 3)
    if [ ! -z "$RESPONSE" ]; then
        echo "✅ Aplicação respondendo!"
        echo "$RESPONSE"
    else
        echo "⚠️  Sem resposta da aplicação"
    fi
fi
echo ""

# 8. Reiniciar Traefik para forçar detecção
echo "8️⃣ Reiniciando Traefik para forçar detecção..."
docker restart traefik-proxy
echo "✅ Traefik reiniciado"
echo ""

echo "================================================"
echo "✅ Correção concluída!"
echo ""
echo "🌐 Teste o domínio: http://$DOMAIN"
echo "📊 Dashboard Traefik: http://SEU_IP:8080"
echo ""
echo "⏳ Aguarde 5-10 segundos para o Traefik detectar as mudanças"
