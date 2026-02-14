#!/bin/bash

# Script completo para corrigir GitHub OAuth na VPS
# Execute como: bash FIX-GITHUB-OAUTH-COMPLETO.sh

set -e  # Parar em caso de erro

echo "🔧 Correção Completa do GitHub OAuth"
echo "====================================="
echo ""

# 1. Verificar se estamos no diretório correto
if [ ! -f "docker-compose.prod.yml" ]; then
    echo "❌ Erro: docker-compose.prod.yml não encontrado"
    echo "   Execute este script no diretório /root/deploy-manager"
    exit 1
fi

# 2. Fazer backup do .env
echo "📦 Fazendo backup do .env..."
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# 3. Atualizar código do GitHub
echo "📥 Atualizando código do GitHub..."
git fetch origin
git reset --hard origin/main

# 4. Verificar se o commit correto está presente
echo "🔍 Verificando commits recentes..."
git log --oneline -5

# 5. Parar containers
echo "⏸️  Parando containers..."
docker-compose -f docker-compose.prod.yml down

# 6. Remover imagens antigas do frontend
echo "🗑️  Removendo imagem antiga do frontend..."
docker rmi deploy-manager-frontend 2>/dev/null || true

# 7. Rebuild do frontend (sem cache)
echo "🔨 Reconstruindo frontend (isso pode demorar alguns minutos)..."
docker-compose -f docker-compose.prod.yml build --no-cache frontend

# 8. Subir containers
echo "🚀 Iniciando containers..."
docker-compose -f docker-compose.prod.yml up -d

# 9. Aguardar containers iniciarem
echo "⏳ Aguardando containers iniciarem..."
sleep 10

# 10. Verificar status
echo ""
echo "📊 Status dos containers:"
docker-compose -f docker-compose.prod.yml ps

# 11. Testar rota do GitHub OAuth
echo ""
echo "🧪 Testando rota do GitHub OAuth..."
sleep 5  # Aguardar backend iniciar completamente

RESPONSE=$(curl -s http://localhost:8001/api/github/auth/github)
if echo "$RESPONSE" | grep -q "authUrl"; then
    echo "✅ Rota do GitHub OAuth funcionando!"
else
    echo "⚠️  Rota pode não estar funcionando corretamente"
    echo "   Resposta: $RESPONSE"
fi

# 12. Verificar configurações do MongoDB
echo ""
echo "🔍 Verificando configurações do GitHub no MongoDB..."
docker exec deploy-manager-mongodb-1 mongosh -u admin -p vQO20N8X8k41oRkAUWAEnw== --authenticationDatabase admin ark-deploy --eval "
  const settings = db.systemsettings.findOne();
  if (settings) {
    print('✅ Configurações encontradas:');
    print('   githubClientId: ' + (settings.githubClientId ? '✅ Configurado' : '❌ Não configurado'));
    print('   githubClientSecret: ' + (settings.githubClientSecret ? '✅ Configurado' : '❌ Não configurado'));
    print('   githubCallbackUrl: ' + (settings.githubCallbackUrl || '❌ Não configurado'));
  } else {
    print('❌ Nenhuma configuração encontrada no MongoDB');
  }
" --quiet

# 13. Mostrar logs recentes
echo ""
echo "📝 Últimos logs do backend:"
echo "----------------------------"
docker-compose -f docker-compose.prod.yml logs --tail=20 backend

echo ""
echo "✅ Correção concluída!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Abra o navegador em: http://38.242.213.195.sslip.io:8000"
echo "   2. Faça um hard refresh: Ctrl + Shift + R"
echo "   3. Abra o DevTools (F12) → Network → Marque 'Disable cache'"
echo "   4. Tente conectar ao GitHub"
echo ""
echo "📝 Para ver logs em tempo real:"
echo "   docker-compose -f docker-compose.prod.yml logs -f backend"
echo ""
echo "🔍 Se ainda houver erro, verifique:"
echo "   - Se o githubClientId está configurado no painel Admin → Configurações"
echo "   - Se o cache do navegador foi limpo"
echo "   - Os logs do backend acima"
