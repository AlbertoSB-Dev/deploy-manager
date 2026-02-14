#!/bin/bash

# ========================================
# Script de Atualização - GitHub OAuth
# ========================================
# 
# Este script atualiza o painel na VPS com as correções do GitHub OAuth
# que agora busca configurações do MongoDB em vez do .env
#
# Executar na VPS como root
# ========================================

set -e  # Parar em caso de erro

echo "🚀 Iniciando atualização do painel..."
echo ""

# 1. Ir para o diretório do projeto
echo "📁 Acessando diretório do projeto..."
cd /opt/ark-deploy

# 2. Fazer backup do .env (por segurança)
echo "💾 Fazendo backup do .env..."
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# 3. Fazer git pull
echo "📥 Baixando atualizações do GitHub..."
git fetch origin main
git reset --hard origin/main

# 4. Parar containers
echo "⏹️  Parando containers..."
docker-compose down

# 5. Remover imagens antigas (força rebuild)
echo "🗑️  Removendo imagens antigas..."
docker rmi ark-deploy-backend ark-deploy-frontend 2>/dev/null || true

# 6. Limpar cache do Docker
echo "🧹 Limpando cache do Docker..."
docker builder prune -af

# 7. Rebuild completo (sem cache)
echo "🔨 Reconstruindo containers (isso pode levar 5-10 minutos)..."
docker-compose build --no-cache --pull

# 8. Subir containers
echo "🚀 Iniciando containers..."
docker-compose up -d

# 9. Aguardar containers ficarem prontos
echo "⏳ Aguardando containers iniciarem (30 segundos)..."
sleep 30

# 10. Verificar status
echo ""
echo "✅ Atualização concluída!"
echo ""
echo "📊 Status dos containers:"
docker-compose ps
echo ""

# 11. Verificar logs do backend
echo "📋 Últimas linhas do log do backend:"
docker-compose logs --tail=20 backend
echo ""

# 12. Verificar configuração do GitHub OAuth
echo "🔍 Verificando configuração do GitHub OAuth:"
docker-compose logs backend | grep "GitHub OAuth Config" -A 3 | tail -10
echo ""

echo "✅ Pronto! Agora:"
echo "1. Acesse o painel: http://painel.38.242.213.195.sslip.io"
echo "2. Faça login como super admin"
echo "3. Vá em Admin → Configurações"
echo "4. Verifique se as configurações do GitHub OAuth estão salvas"
echo "5. Teste a conexão com o GitHub"
echo ""
echo "📖 Para ver logs em tempo real:"
echo "   docker-compose logs -f backend"
echo ""
