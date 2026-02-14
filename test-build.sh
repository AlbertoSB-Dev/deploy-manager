#!/bin/bash

# Script para testar build antes de fazer push para GitHub

echo "🧪 Testando build do projeto..."
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para verificar se comando foi bem sucedido
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
        return 0
    else
        echo -e "${RED}❌ $1${NC}"
        return 1
    fi
}

# 1. Testar build do Backend
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 BACKEND - TypeScript Build"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd backend

echo "→ Instalando dependências..."
npm install --silent
check_status "Dependências do backend instaladas" || exit 1

echo "→ Compilando TypeScript..."
npm run build
check_status "Build do backend concluído" || exit 1

echo ""
cd ..

# 2. Testar build do Frontend
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎨 FRONTEND - Next.js Build"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd frontend

echo "→ Instalando dependências..."
npm install --silent
check_status "Dependências do frontend instaladas" || exit 1

echo "→ Compilando Next.js..."
npm run build
check_status "Build do frontend concluído" || exit 1

# Verificar se standalone foi gerado
if [ -d ".next/standalone" ]; then
    echo -e "${GREEN}✅ Diretório .next/standalone gerado corretamente${NC}"
else
    echo -e "${RED}❌ Diretório .next/standalone NÃO foi gerado!${NC}"
    echo -e "${YELLOW}⚠️  Verifique se next.config.js tem: output: 'standalone'${NC}"
    exit 1
fi

echo ""
cd ..

# 3. Resumo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RESUMO DO BUILD"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Backend compilado com sucesso${NC}"
echo -e "${GREEN}✅ Frontend compilado com sucesso${NC}"
echo -e "${GREEN}✅ Standalone gerado corretamente${NC}"
echo ""
echo -e "${GREEN}🎉 Projeto pronto para deploy!${NC}"
echo ""
echo "Próximos passos:"
echo "  1. git add ."
echo "  2. git commit -m 'sua mensagem'"
echo "  3. git push origin main"
echo ""
