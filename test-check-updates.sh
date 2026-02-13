#!/bin/bash

echo "=========================================="
echo "🧪 TESTE DE VERIFICAÇÃO DE ATUALIZAÇÕES"
echo "=========================================="
echo ""

# Testar rota check-updates
echo "1️⃣ Testando rota /admin/check-updates"
echo ""

curl -X GET http://api.38.242.213.195.sslip.io/api/admin/check-updates \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  2>/dev/null | jq '.'

echo ""
echo "=========================================="
echo "2️⃣ Verificando logs do backend"
echo "=========================================="
echo ""

docker-compose logs backend | tail -20

echo ""
echo "=========================================="
echo "3️⃣ Verificando se está em Docker"
echo "=========================================="
echo ""

docker-compose exec backend test -f /.dockerenv && echo "✅ Está em Docker" || echo "❌ Não está em Docker"

echo ""
echo "=========================================="
echo "4️⃣ Verificando commit hash no package.json"
echo "=========================================="
echo ""

docker-compose exec backend cat package.json | grep gitCommit || echo "❌ gitCommit não encontrado"

echo ""
echo "=========================================="
