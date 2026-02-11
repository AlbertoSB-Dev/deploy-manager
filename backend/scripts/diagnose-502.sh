#!/bin/bash

# Script para diagnosticar erro 502
# Execute no servidor VPS

PROJECT_NAME=${1:-"painelark"}

echo "🔍 DIAGNÓSTICO COMPLETO - ERRO 502"
echo "═══════════════════════════════════════════════════════════"
echo ""

# 1. Verificar container
echo "1️⃣ STATUS DO CONTAINER"
echo "─────────────────────────────────────────────────────────"
CONTAINER_ID=$(docker ps -a --filter "name=$PROJECT_NAME" --format "{{.ID}}" | head -n 1)

if [ -z "$CONTAINER_ID" ]; then
  echo "❌ Nenhum container encontrado para $PROJECT_NAME"
  exit 1
fi

echo "Container ID: $CONTAINER_ID"
docker ps -a --filter "id=$CONTAINER_ID" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

# 2. Verificar se está rodando
echo "2️⃣ VERIFICANDO SE CONTAINER ESTÁ RODANDO"
echo "─────────────────────────────────────────────────────────"
STATUS=$(docker inspect $CONTAINER_ID --format '{{.State.Status}}')
RUNNING=$(docker inspect $CONTAINER_ID --format '{{.State.Running}}')

echo "Status: $STATUS"
echo "Running: $RUNNING"

if [ "$RUNNING" != "true" ]; then
  echo "❌ Container não está rodando!"
  echo ""
  echo "📋 Últimas 50 linhas dos logs:"
  docker logs --tail 50 $CONTAINER_ID
  exit 1
fi

echo "✅ Container está rodando"
echo ""

# 3. Verificar IP e rede
echo "3️⃣ REDE E IP DO CONTAINER"
echo "─────────────────────────────────────────────────────────"
docker inspect $CONTAINER_ID --format '{{range $key, $value := .NetworkSettings.Networks}}Rede: {{$key}} | IP: {{$value.IPAddress}}{{println}}{{end}}'
CONTAINER_IP=$(docker inspect $CONTAINER_ID --format '{{range $key, $value := .NetworkSettings.Networks}}{{if eq $key "coolify"}}{{$value.IPAddress}}{{end}}{{end}}')

if [ -z "$CONTAINER_IP" ]; then
  echo "⚠️  Container não está na rede coolify, pegando primeiro IP disponível"
  CONTAINER_IP=$(docker inspect $CONTAINER_ID --format '{{range $key, $value := .NetworkSettings.Networks}}{{$value.IPAddress}}{{println}}{{end}}' | head -n 1)
fi

echo "IP usado pelo Nginx: $CONTAINER_IP"
echo ""

# 4. Verificar portas escutando DENTRO do container
echo "4️⃣ PORTAS ESCUTANDO DENTRO DO CONTAINER"
echo "─────────────────────────────────────────────────────────"
echo "Verificando com netstat:"
docker exec $CONTAINER_ID netstat -tlnp 2>/dev/null || echo "netstat não disponível"
echo ""
echo "Verificando com ss:"
docker exec $CONTAINER_ID ss -tlnp 2>/dev/null || echo "ss não disponível"
echo ""

# 5. Testar conectividade do HOST para o container
echo "5️⃣ TESTE DE CONECTIVIDADE (HOST → CONTAINER)"
echo "─────────────────────────────────────────────────────────"
for PORT in 3000 8000 80 8080; do
  echo -n "Testando porta $PORT: "
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://$CONTAINER_IP:$PORT --max-time 2 2>/dev/null || echo "TIMEOUT")
  if [ "$HTTP_CODE" = "TIMEOUT" ] || [ "$HTTP_CODE" = "000" ]; then
    echo "❌ Sem resposta"
  else
    echo "✅ HTTP $HTTP_CODE"
  fi
done
echo ""

# 6. Verificar variáveis de ambiente do container
echo "6️⃣ VARIÁVEIS DE AMBIENTE DO CONTAINER"
echo "─────────────────────────────────────────────────────────"
docker inspect $CONTAINER_ID --format '{{range .Config.Env}}{{println .}}{{end}}' | grep -E "PORT|NODE_ENV"
echo ""

# 7. Verificar configuração do Nginx
echo "7️⃣ CONFIGURAÇÃO DO NGINX"
echo "─────────────────────────────────────────────────────────"
if [ -f "/etc/nginx/sites-enabled/$PROJECT_NAME" ]; then
  echo "✅ Configuração existe"
  cat /etc/nginx/sites-enabled/$PROJECT_NAME
else
  echo "❌ Configuração não encontrada"
fi
echo ""

# 8. Testar Nginx
echo "8️⃣ TESTE DO NGINX"
echo "─────────────────────────────────────────────────────────"
nginx -t 2>&1
echo ""

# 9. Logs recentes do container
echo "9️⃣ LOGS RECENTES DO CONTAINER (últimas 30 linhas)"
echo "─────────────────────────────────────────────────────────"
docker logs --tail 30 $CONTAINER_ID
echo ""

# 10. Teste final
echo "🔟 TESTE FINAL DE ACESSO"
echo "─────────────────────────────────────────────────────────"
DOMAIN=$(grep server_name /etc/nginx/sites-enabled/$PROJECT_NAME 2>/dev/null | awk '{print $2}' | tr -d ';')
if [ -n "$DOMAIN" ]; then
  echo "Domínio: $DOMAIN"
  echo "Testando acesso:"
  curl -I http://localhost -H "Host: $DOMAIN" 2>/dev/null | head -n 10
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ Diagnóstico concluído!"
echo ""
echo "💡 PRÓXIMOS PASSOS:"
echo "   1. Verifique se o container está escutando na porta correta"
echo "   2. Verifique os logs do container para erros"
echo "   3. Verifique se a aplicação está configurada para usar a variável PORT"
