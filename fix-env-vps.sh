#!/bin/bash

# ============================================
# ARK DEPLOY - CORREÇÃO AUTOMÁTICA DE .env
# ============================================
# Este script verifica e corrige a configuração
# de variáveis de ambiente na VPS
# ============================================

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 ARK DEPLOY - Correção Automática de .env${NC}"
echo ""

# Verificar se está na raiz
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Execute este script na raiz do projeto${NC}"
    exit 1
fi

# Verificar se .env existe na raiz
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Arquivo .env NÃO encontrado na raiz${NC}"
    echo ""
    
    # Verificar se existe .env.production
    if [ -f ".env.production" ]; then
        echo -e "${GREEN}✅ Encontrado .env.production${NC}"
        echo "📋 Copiando .env.production para .env..."
        cp .env.production .env
        echo -e "${GREEN}✅ Arquivo .env criado!${NC}"
    else
        echo -e "${YELLOW}⚠️  .env.production também não encontrado${NC}"
        echo "📋 Criando .env a partir do .env.example..."
        cp .env.example .env
        echo -e "${YELLOW}⚠️  ATENÇÃO: Você precisa editar o .env com valores reais!${NC}"
        echo ""
        echo "Execute:"
        echo "  nano .env"
        echo ""
        exit 1
    fi
else
    echo -e "${GREEN}✅ Arquivo .env encontrado na raiz${NC}"
fi

echo ""

# Verificar variáveis críticas
echo "🔍 Verificando variáveis críticas..."
echo ""

# Função para verificar variável
check_and_fix_var() {
    local var_name=$1
    local default_value=$2
    local current_value=$(grep "^${var_name}=" .env 2>/dev/null | cut -d '=' -f2- | tr -d '"' | tr -d "'")
    
    if [ -z "$current_value" ] || [ "$current_value" = "$default_value" ]; then
        echo -e "${YELLOW}⚠️  $var_name não configurado ou usando valor padrão${NC}"
        
        # Tentar pegar de backend/.env
        if [ -f "backend/.env" ]; then
            local backend_value=$(grep "^${var_name}=" backend/.env 2>/dev/null | cut -d '=' -f2- | tr -d '"' | tr -d "'")
            if [ -n "$backend_value" ] && [ "$backend_value" != "$default_value" ]; then
                echo -e "${GREEN}  ✅ Encontrado em backend/.env: $backend_value${NC}"
                sed -i "s|^${var_name}=.*|${var_name}=${backend_value}|" .env
                echo -e "${GREEN}  ✅ Atualizado no .env da raiz${NC}"
                return 0
            fi
        fi
        
        # Tentar pegar de frontend/.env.local
        if [ -f "frontend/.env.local" ]; then
            local frontend_value=$(grep "^${var_name}=" frontend/.env.local 2>/dev/null | cut -d '=' -f2- | tr -d '"' | tr -d "'")
            if [ -n "$frontend_value" ] && [ "$frontend_value" != "$default_value" ]; then
                echo -e "${GREEN}  ✅ Encontrado em frontend/.env.local: $frontend_value${NC}"
                sed -i "s|^${var_name}=.*|${var_name}=${frontend_value}|" .env
                echo -e "${GREEN}  ✅ Atualizado no .env da raiz${NC}"
                return 0
            fi
        fi
        
        echo -e "${RED}  ❌ Não encontrado em nenhum lugar${NC}"
        return 1
    else
        echo -e "${GREEN}✅ $var_name: OK${NC}"
        return 0
    fi
}

# Verificar e corrigir variáveis
NEEDS_MANUAL=0

check_and_fix_var "MONGO_PASSWORD" "changeme123" || NEEDS_MANUAL=1
check_and_fix_var "JWT_SECRET" "your-secret-key-change-in-production" || NEEDS_MANUAL=1
check_and_fix_var "ENCRYPTION_KEY" "your-encryption-key-32-chars-min" || NEEDS_MANUAL=1
check_and_fix_var "SERVER_IP" "localhost" || NEEDS_MANUAL=1
check_and_fix_var "NEXT_PUBLIC_API_URL" "http://localhost:8001/api" || NEEDS_MANUAL=1

echo ""

# Verificar se NEXT_PUBLIC_API_URL está correto
API_URL=$(grep "^NEXT_PUBLIC_API_URL=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
if [[ "$API_URL" == *"localhost"* ]]; then
    echo -e "${YELLOW}⚠️  NEXT_PUBLIC_API_URL ainda está apontando para localhost${NC}"
    
    # Tentar detectar IP do servidor
    SERVER_IP=$(grep "^SERVER_IP=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
    if [ -n "$SERVER_IP" ] && [ "$SERVER_IP" != "localhost" ]; then
        NEW_API_URL="http://api.${SERVER_IP}.sslip.io/api"
        echo -e "${GREEN}✅ Detectado SERVER_IP: $SERVER_IP${NC}"
        echo -e "${GREEN}✅ Corrigindo NEXT_PUBLIC_API_URL para: $NEW_API_URL${NC}"
        sed -i "s|^NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=${NEW_API_URL}|" .env
    else
        echo -e "${RED}❌ Não foi possível detectar SERVER_IP${NC}"
        NEEDS_MANUAL=1
    fi
fi

echo ""

# Mostrar resumo
echo -e "${BLUE}📊 Resumo da Configuração:${NC}"
echo ""
cat .env | grep -E "^(MONGO_PASSWORD|JWT_SECRET|SERVER_IP|NEXT_PUBLIC_API_URL|FRONTEND_URL)=" | while read line; do
    echo "  $line"
done

echo ""

if [ $NEEDS_MANUAL -eq 1 ]; then
    echo -e "${YELLOW}⚠️  ATENÇÃO: Algumas variáveis precisam ser configuradas manualmente${NC}"
    echo ""
    echo "Execute:"
    echo "  nano .env"
    echo ""
    echo "Depois execute:"
    echo "  docker-compose down"
    echo "  docker-compose build --no-cache"
    echo "  docker-compose up -d"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Configuração corrigida!${NC}"
echo ""
echo "📋 Próximos passos:"
echo ""
echo "1. Revise o .env (opcional):"
echo "   nano .env"
echo ""
echo "2. Rebuild dos containers:"
echo "   docker-compose down"
echo "   docker-compose build --no-cache"
echo "   docker-compose up -d"
echo ""
echo "3. Verificar logs:"
echo "   docker-compose logs -f"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANTE: O rebuild é OBRIGATÓRIO para aplicar NEXT_PUBLIC_API_URL!${NC}"
echo ""

# Perguntar se quer fazer rebuild agora
read -p "Deseja fazer o rebuild agora? (s/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo ""
    echo "🔄 Iniciando rebuild..."
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d
    echo ""
    echo -e "${GREEN}✅ Rebuild concluído!${NC}"
    echo ""
    echo "📋 Verificando logs..."
    sleep 3
    docker-compose logs --tail=20
fi

echo ""
echo -e "${GREEN}✅ Processo concluído!${NC}"
echo ""
