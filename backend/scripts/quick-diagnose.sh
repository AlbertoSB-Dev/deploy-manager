#!/bin/bash

# Script para diagnóstico rápido no servidor
# Execute este script diretamente no servidor VPS

echo "🔍 DIAGNÓSTICO RÁPIDO"
echo "═══════════════════════════════════════════════════════════"

PROJECT_NAME=${1:-"painelark"}

echo ""
echo "📦 Containers do projeto $PROJECT_NAME:"
docker ps -a --filter "name=$PROJECT_NAME" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "🌐 Redes Docker:"
docker network ls

echo ""
echo "📡 IP do container na rede coolify:"
CONTAINER_NAME=$(docker ps --filter "name=$PROJECT_NAME" --format "{{.Names}}" | head -n 1)
if [ -n "$CONTAINER_NAME" ]; then
  echo "Container: $CONTAINER_NAME"
  docker inspect $CONTAINER_NAME --format '{{range $key, $value := .NetworkSettings.Networks}}{{$key}}: {{$value.IPAddress}}{{println}}{{end}}'
  
  CONTAINER_IP=$(docker inspect $CONTAINER_NAME --format '{{range $key, $value := .NetworkSettings.Networks}}{{if eq $key "coolify"}}{{$value.IPAddress}}{{end}}{{end}}')
  
  if [ -n "$CONTAINER_IP" ]; then
    echo ""
    echo "🔌 Testando conectividade para $CONTAINER_IP:8000:"
    curl -I -s --max-time 5 http://$CONTAINER_IP:8000 || echo "❌ Não conseguiu conectar"
    
    echo ""
    echo "📋 Últimas 30 linhas dos logs do container:"
    docker logs --tail 30 $CONTAINER_NAME
  else
    echo "❌ Container não está na rede coolify"
  fi
else
  echo "❌ Nenhum container encontrado"
fi

echo ""
echo "📝 Configuração do Nginx:"
if [ -f "/etc/nginx/sites-enabled/$PROJECT_NAME" ]; then
  cat /etc/nginx/sites-enabled/$PROJECT_NAME
else
  echo "❌ Configuração não encontrada"
fi

echo ""
echo "🔥 Status do Nginx:"
systemctl status nginx --no-pager | head -n 10

echo ""
echo "🌐 Testando Nginx localmente:"
curl -I -s http://localhost -H "Host: painelark.38.242.213.195.sslip.io" | head -n 10
