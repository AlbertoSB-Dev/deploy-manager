#!/bin/bash

echo "🔍 Diagnóstico Ark Deploy"
echo "=========================="
echo ""

echo "📦 Status dos Containers:"
docker-compose ps
echo ""

echo "🌐 Portas Abertas:"
netstat -tlnp | grep -E '8000|8001|27017' || ss -tlnp | grep -E '8000|8001|27017'
echo ""

echo "🔥 Firewall:"
ufw status 2>/dev/null || firewall-cmd --list-all 2>/dev/null || echo "Firewall não detectado"
echo ""

echo "📝 Últimos logs do Backend:"
docker-compose logs backend --tail=20
echo ""

echo "📝 Últimos logs do Frontend:"
docker-compose logs frontend --tail=20
echo ""

echo "🌍 Testando acesso local:"
echo "Backend:"
curl -s http://localhost:8001/api/health || echo "❌ Backend não responde"
echo ""
echo "Frontend:"
curl -s -I http://localhost:8000 | head -1 || echo "❌ Frontend não responde"
echo ""

echo "📊 Variáveis de Ambiente:"
echo "SERVER_IP=$(grep SERVER_IP .env | cut -d= -f2)"
echo "FRONTEND_URL=$(grep FRONTEND_URL .env | cut -d= -f2)"
echo ""

echo "✅ Diagnóstico completo!"
