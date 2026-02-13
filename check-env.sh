#!/bin/bash

# ============================================
# ARK DEPLOY - VERIFICAÇÃO DE AMBIENTE
# ============================================
# Este script verifica se as variáveis de ambiente
# estão configuradas corretamente
# ============================================

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 ARK DEPLOY - Verificação de Ambiente${NC}"
echo ""

# Verificar se está na raiz
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Execute este script na raiz do projeto${NC}"
    exit 1
fi

# Verificar arquivo .env
echo "📋 Verificando arquivo .env..."
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Arquivo .env não encontrado na raiz${NC}"
    echo -e "${YELLOW}💡 Execute: cp .env.example .env${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Arquivo .env encontrado${NC}"
fi

echo ""

# Função para verificar variável
check_var() {
    local var_name=$1
    local required=$2
    local value=$(grep "^${var_name}=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
    
    if [ -z "$value" ] || [ "$value" = "changeme123" ] || [ "$value" = "your-secret-key-change-in-production" ]; then
        if [ "$required" = "true" ]; then
            echo -e "${RED}❌ $var_name: NÃO CONFIGURADO${NC}"
            return 1
        else
            echo -e "${YELLOW}⚠️  $var_name: Opcional (não configurado)${NC}"
            return 0
        fi
    else
        echo -e "${GREEN}✅ $var_name: Configurado${NC}"
        return 0
    fi
}

# Verificar variáveis obrigatórias
echo "🔐 Variáveis de Segurança:"
check_var "MONGO_PASSWORD" "true"
check_var "JWT_SECRET" "true"
check_var "ENCRYPTION_KEY" "true"
echo ""

echo "🌐 Configuração de Servidor:"
check_var "SERVER_IP" "true"
check_var "BASE_DOMAIN" "true"
check_var "FRONTEND_URL" "true"
check_var "NEXT_PUBLIC_API_URL" "true"
echo ""

echo "🔧 Integrações (Opcionais):"
check_var "GITHUB_CLIENT_ID" "false"
check_var "ASSAS_API_KEY" "false"
check_var "EMAIL_ENABLED" "false"
echo ""

# Verificar se NEXT_PUBLIC_API_URL está correto
API_URL=$(grep "^NEXT_PUBLIC_API_URL=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
if [[ "$API_URL" == *"localhost"* ]]; then
    echo -e "${YELLOW}⚠️  NEXT_PUBLIC_API_URL está apontando para localhost${NC}"
    echo -e "${YELLOW}   Em produção, deve ser: http://api.SEU_IP.sslip.io/api${NC}"
    echo ""
fi

# Verificar containers Docker
echo "🐳 Status dos Containers:"
if command -v docker &> /dev/null; then
    if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "ark-deploy"; then
        docker ps --format "table {{.Names}}\t{{.Status}}" | grep "ark-deploy"
        echo ""
        echo -e "${GREEN}✅ Containers rodando${NC}"
    else
        echo -e "${YELLOW}⚠️  Nenhum container rodando${NC}"
        echo -e "${YELLOW}💡 Execute: docker-compose up -d${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Docker não encontrado${NC}"
fi

echo ""

# Verificar logs do frontend para NEXT_PUBLIC_API_URL
echo "🔍 Verificando configuração do Frontend..."
if docker ps | grep -q "ark-deploy-frontend"; then
    FRONTEND_LOG=$(docker logs ark-deploy-frontend 2>&1 | grep -i "api" | tail -1)
    if [ -n "$FRONTEND_LOG" ]; then
        echo -e "${BLUE}Último log relacionado à API:${NC}"
        echo "$FRONTEND_LOG"
    fi
    
    # Verificar se Socket.IO está tentando conectar em localhost
    SOCKET_ERROR=$(docker logs ark-deploy-frontend 2>&1 | grep -i "localhost:8001" | tail -1)
    if [ -n "$SOCKET_ERROR" ]; then
        echo ""
        echo -e "${RED}❌ PROBLEMA DETECTADO: Socket.IO tentando conectar em localhost${NC}"
        echo -e "${YELLOW}💡 Solução:${NC}"
        echo "   1. Verifique NEXT_PUBLIC_API_URL no .env"
        echo "   2. Execute: docker-compose build --no-cache frontend"
        echo "   3. Execute: docker-compose up -d"
    fi
else
    echo -e "${YELLOW}⚠️  Container frontend não está rodando${NC}"
fi

echo ""

# Resumo
echo -e "${BLUE}📊 Resumo:${NC}"
echo ""
echo "📁 Arquivo .env: $([ -f .env ] && echo -e "${GREEN}OK${NC}" || echo -e "${RED}FALTANDO${NC}")"
echo "🐳 Docker: $(command -v docker &> /dev/null && echo -e "${GREEN}Instalado${NC}" || echo -e "${RED}Não instalado${NC}")"
echo "📦 Containers: $(docker ps | grep -q "ark-deploy" && echo -e "${GREEN}Rodando${NC}" || echo -e "${YELLOW}Parados${NC}")"

echo ""
echo -e "${BLUE}📚 Documentação:${NC}"
echo "   ENV-SETUP.md - Guia completo de configuração"
echo "   README.md - Documentação geral"
echo ""
