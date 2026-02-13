#!/bin/bash

# ============================================
# ARK DEPLOY - MIGRAÇÃO DE VARIÁVEIS DE AMBIENTE
# ============================================
# Este script migra variáveis dos arquivos antigos
# (backend/.env e frontend/.env.local) para o novo
# arquivo centralizado (.env na raiz)
# ============================================

set -e

echo "🔄 Iniciando migração de variáveis de ambiente..."
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar se está na raiz do projeto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erro: Execute este script na raiz do projeto deploy-manager${NC}"
    exit 1
fi

# Criar backup dos arquivos antigos
echo "📦 Criando backup dos arquivos antigos..."
BACKUP_DIR="env-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

if [ -f "backend/.env" ]; then
    cp backend/.env "$BACKUP_DIR/backend.env"
    echo -e "${GREEN}✅ Backup: backend/.env → $BACKUP_DIR/backend.env${NC}"
fi

if [ -f "frontend/.env.local" ]; then
    cp frontend/.env.local "$BACKUP_DIR/frontend.env.local"
    echo -e "${GREEN}✅ Backup: frontend/.env.local → $BACKUP_DIR/frontend.env.local${NC}"
fi

if [ -f ".env" ]; then
    cp .env "$BACKUP_DIR/root.env"
    echo -e "${GREEN}✅ Backup: .env → $BACKUP_DIR/root.env${NC}"
fi

echo ""

# Função para extrair valor de variável
get_env_value() {
    local file=$1
    local key=$2
    if [ -f "$file" ]; then
        grep "^${key}=" "$file" | cut -d '=' -f2- | tr -d '"' | tr -d "'"
    fi
}

# Iniciar novo arquivo .env
echo "📝 Criando novo arquivo .env centralizado..."
echo ""

# Se já existe .env, perguntar se quer sobrescrever
if [ -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Arquivo .env já existe na raiz${NC}"
    read -p "Deseja sobrescrever? (s/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo -e "${YELLOW}❌ Migração cancelada${NC}"
        exit 0
    fi
fi

# Copiar template
cp .env.example .env

# Migrar variáveis do backend/.env
if [ -f "backend/.env" ]; then
    echo "🔍 Migrando variáveis de backend/.env..."
    
    MONGO_PASSWORD=$(get_env_value "backend/.env" "MONGO_PASSWORD")
    JWT_SECRET=$(get_env_value "backend/.env" "JWT_SECRET")
    ENCRYPTION_KEY=$(get_env_value "backend/.env" "ENCRYPTION_KEY")
    SERVER_IP=$(get_env_value "backend/.env" "SERVER_IP")
    BASE_DOMAIN=$(get_env_value "backend/.env" "BASE_DOMAIN")
    FRONTEND_URL=$(get_env_value "backend/.env" "FRONTEND_URL")
    GITHUB_CLIENT_ID=$(get_env_value "backend/.env" "GITHUB_CLIENT_ID")
    GITHUB_CLIENT_SECRET=$(get_env_value "backend/.env" "GITHUB_CLIENT_SECRET")
    GITHUB_CALLBACK_URL=$(get_env_value "backend/.env" "GITHUB_CALLBACK_URL")
    ASSAS_API_KEY=$(get_env_value "backend/.env" "ASSAS_API_KEY")
    ASSAS_WEBHOOK_TOKEN=$(get_env_value "backend/.env" "ASSAS_WEBHOOK_TOKEN")
    ASSAS_ENVIRONMENT=$(get_env_value "backend/.env" "ASSAS_ENVIRONMENT")
    EMAIL_ENABLED=$(get_env_value "backend/.env" "EMAIL_ENABLED")
    EMAIL_SERVICE=$(get_env_value "backend/.env" "EMAIL_SERVICE")
    EMAIL_USER=$(get_env_value "backend/.env" "EMAIL_USER")
    EMAIL_PASSWORD=$(get_env_value "backend/.env" "EMAIL_PASSWORD")
    
    # Aplicar valores encontrados
    [ -n "$MONGO_PASSWORD" ] && sed -i "s|^MONGO_PASSWORD=.*|MONGO_PASSWORD=$MONGO_PASSWORD|" .env
    [ -n "$JWT_SECRET" ] && sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env
    [ -n "$ENCRYPTION_KEY" ] && sed -i "s|^ENCRYPTION_KEY=.*|ENCRYPTION_KEY=$ENCRYPTION_KEY|" .env
    [ -n "$SERVER_IP" ] && sed -i "s|^SERVER_IP=.*|SERVER_IP=$SERVER_IP|" .env
    [ -n "$BASE_DOMAIN" ] && sed -i "s|^BASE_DOMAIN=.*|BASE_DOMAIN=$BASE_DOMAIN|" .env
    [ -n "$FRONTEND_URL" ] && sed -i "s|^FRONTEND_URL=.*|FRONTEND_URL=$FRONTEND_URL|" .env
    [ -n "$GITHUB_CLIENT_ID" ] && sed -i "s|^GITHUB_CLIENT_ID=.*|GITHUB_CLIENT_ID=$GITHUB_CLIENT_ID|" .env
    [ -n "$GITHUB_CLIENT_SECRET" ] && sed -i "s|^GITHUB_CLIENT_SECRET=.*|GITHUB_CLIENT_SECRET=$GITHUB_CLIENT_SECRET|" .env
    [ -n "$GITHUB_CALLBACK_URL" ] && sed -i "s|^GITHUB_CALLBACK_URL=.*|GITHUB_CALLBACK_URL=$GITHUB_CALLBACK_URL|" .env
    [ -n "$ASSAS_API_KEY" ] && sed -i "s|^ASSAS_API_KEY=.*|ASSAS_API_KEY=$ASSAS_API_KEY|" .env
    [ -n "$ASSAS_WEBHOOK_TOKEN" ] && sed -i "s|^ASSAS_WEBHOOK_TOKEN=.*|ASSAS_WEBHOOK_TOKEN=$ASSAS_WEBHOOK_TOKEN|" .env
    [ -n "$ASSAS_ENVIRONMENT" ] && sed -i "s|^ASSAS_ENVIRONMENT=.*|ASSAS_ENVIRONMENT=$ASSAS_ENVIRONMENT|" .env
    [ -n "$EMAIL_ENABLED" ] && sed -i "s|^EMAIL_ENABLED=.*|EMAIL_ENABLED=$EMAIL_ENABLED|" .env
    [ -n "$EMAIL_SERVICE" ] && sed -i "s|^EMAIL_SERVICE=.*|EMAIL_SERVICE=$EMAIL_SERVICE|" .env
    [ -n "$EMAIL_USER" ] && sed -i "s|^EMAIL_USER=.*|EMAIL_USER=$EMAIL_USER|" .env
    [ -n "$EMAIL_PASSWORD" ] && sed -i "s|^EMAIL_PASSWORD=.*|EMAIL_PASSWORD=$EMAIL_PASSWORD|" .env
    
    echo -e "${GREEN}✅ Variáveis do backend migradas${NC}"
fi

# Migrar variáveis do frontend/.env.local
if [ -f "frontend/.env.local" ]; then
    echo "🔍 Migrando variáveis de frontend/.env.local..."
    
    NEXT_PUBLIC_API_URL=$(get_env_value "frontend/.env.local" "NEXT_PUBLIC_API_URL")
    
    [ -n "$NEXT_PUBLIC_API_URL" ] && sed -i "s|^NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL|" .env
    
    echo -e "${GREEN}✅ Variáveis do frontend migradas${NC}"
fi

echo ""
echo -e "${GREEN}✅ Migração concluída!${NC}"
echo ""
echo "📋 Próximos passos:"
echo ""
echo "1. Revise o arquivo .env na raiz:"
echo "   nano .env"
echo ""
echo "2. Ajuste SERVER_IP e NEXT_PUBLIC_API_URL se necessário"
echo ""
echo "3. Reinicie os containers:"
echo "   docker-compose down"
echo "   docker-compose build --no-cache frontend  # Se mudou NEXT_PUBLIC_API_URL"
echo "   docker-compose up -d"
echo ""
echo "4. (Opcional) Remova os arquivos antigos:"
echo "   rm backend/.env"
echo "   rm frontend/.env.local"
echo ""
echo "📦 Backup salvo em: $BACKUP_DIR"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANTE: Se você mudou NEXT_PUBLIC_API_URL, é necessário rebuild do frontend!${NC}"
echo ""
