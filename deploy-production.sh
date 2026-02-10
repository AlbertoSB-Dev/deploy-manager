#!/bin/bash

# ============================================
# ARK DEPLOY - PRODUCTION DEPLOYMENT SCRIPT
# ============================================

set -e

echo "🚀 Ark Deploy - Production Deployment"
echo "======================================"

# Verificar se .env.production existe
if [ ! -f .env.production ]; then
    echo "❌ Erro: Arquivo .env.production não encontrado!"
    echo "📝 Copie .env.production de exemplo e configure:"
    echo "   cp .env.production .env.production"
    echo "   nano .env.production"
    exit 1
fi

# Carregar variáveis de ambiente
export $(cat .env.production | grep -v '^#' | xargs)

# Verificar variáveis obrigatórias
if [ -z "$MONGO_PASSWORD" ] || [ "$MONGO_PASSWORD" == "CHANGE_ME_STRONG_PASSWORD_HERE" ]; then
    echo "❌ Erro: MONGO_PASSWORD não configurado!"
    exit 1
fi

if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" == "CHANGE_ME_RANDOM_STRING_64_CHARS_MIN" ]; then
    echo "❌ Erro: JWT_SECRET não configurado!"
    exit 1
fi

if [ -z "$ENCRYPTION_KEY" ] || [ "$ENCRYPTION_KEY" == "CHANGE_ME_RANDOM_STRING_32_CHARS_MIN" ]; then
    echo "❌ Erro: ENCRYPTION_KEY não configurado!"
    exit 1
fi

echo "✅ Variáveis de ambiente validadas"

# Criar rede do Traefik se não existir
echo "🌐 Verificando rede do Traefik..."
docker network inspect coolify >/dev/null 2>&1 || docker network create coolify
echo "✅ Rede coolify pronta"

# Parar containers antigos
echo "⏸️  Parando containers antigos..."
docker-compose -f docker-compose.prod.yml down || true

# Build das imagens
echo "🔨 Construindo imagens Docker..."
docker-compose -f docker-compose.prod.yml build --no-cache

# Iniciar containers
echo "🚀 Iniciando containers..."
docker-compose -f docker-compose.prod.yml up -d

# Aguardar backend estar pronto
echo "⏳ Aguardando backend iniciar..."
sleep 10

# Verificar se containers estão rodando
echo "🔍 Verificando containers..."
docker-compose -f docker-compose.prod.yml ps

# Criar usuário admin (se não existir)
echo "👤 Criando usuário admin..."
docker-compose -f docker-compose.prod.yml exec -T backend node scripts/make-admin-auto.js || echo "⚠️  Admin já existe ou erro ao criar"

echo ""
echo "✅ Deploy concluído com sucesso!"
echo ""
echo "📍 Acesse o painel:"
echo "   Frontend: http://$SERVER_IP:8000"
echo "   Backend:  http://$SERVER_IP:8001"
if [ ! -z "$DOMAIN" ]; then
    echo "   Domínio:  http://$DOMAIN"
fi
echo ""
echo "🔐 Credenciais padrão:"
echo "   Email: admin@admin.com"
echo "   Senha: admin123"
echo ""
echo "⚠️  IMPORTANTE: Altere a senha após o primeiro login!"
echo ""
echo "📊 Ver logs:"
echo "   docker-compose -f docker-compose.prod.yml logs -f"
echo ""
echo "🔄 Reiniciar:"
echo "   docker-compose -f docker-compose.prod.yml restart"
echo ""
echo "⏹️  Parar:"
echo "   docker-compose -f docker-compose.prod.yml down"
