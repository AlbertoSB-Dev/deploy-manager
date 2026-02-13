#!/bin/bash

echo "=========================================="
echo "🧪 TESTE DE LOGIN - ARK DEPLOY"
echo "=========================================="
echo ""

# Configurações
API_URL="http://api.38.242.213.195.sslip.io/api"
EMAIL="beto@gmail.com"
PASSWORD="admin123"

echo "📍 API URL: $API_URL"
echo "📧 Email: $EMAIL"
echo "🔑 Password: $PASSWORD"
echo ""

echo "=========================================="
echo "1️⃣ Testando Health Check"
echo "=========================================="
curl -s "$API_URL/../health" | jq '.' || echo "❌ Health check falhou"
echo ""

echo "=========================================="
echo "2️⃣ Testando Login"
echo "=========================================="
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "📊 HTTP Status: $HTTP_CODE"
echo "📦 Response Body:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ LOGIN BEM-SUCEDIDO!"
    TOKEN=$(echo "$BODY" | jq -r '.token' 2>/dev/null)
    if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
        echo "🎫 Token: ${TOKEN:0:50}..."
        
        echo ""
        echo "=========================================="
        echo "3️⃣ Testando /auth/me com Token"
        echo "=========================================="
        ME_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/auth/me" \
          -H "Authorization: Bearer $TOKEN")
        
        ME_HTTP_CODE=$(echo "$ME_RESPONSE" | tail -n1)
        ME_BODY=$(echo "$ME_RESPONSE" | head -n-1)
        
        echo "📊 HTTP Status: $ME_HTTP_CODE"
        echo "📦 User Data:"
        echo "$ME_BODY" | jq '.' 2>/dev/null || echo "$ME_BODY"
    fi
else
    echo "❌ LOGIN FALHOU!"
    echo ""
    echo "🔍 Possíveis causas:"
    echo "  - Senha incorreta"
    echo "  - Usuário não existe"
    echo "  - Problema de CORS"
    echo "  - Backend não está rodando"
fi

echo ""
echo "=========================================="
echo "4️⃣ Verificando Containers Docker"
echo "=========================================="
docker-compose ps

echo ""
echo "=========================================="
echo "5️⃣ Últimas 20 linhas do log do Backend"
echo "=========================================="
docker-compose logs --tail=20 backend

echo ""
echo "=========================================="
echo "✅ TESTE CONCLUÍDO"
echo "=========================================="
