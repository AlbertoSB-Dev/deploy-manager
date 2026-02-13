#!/bin/bash

# Script de Configuração da VPS - Ark Deploy
# Este script ajuda a configurar o NEXT_PUBLIC_API_URL corretamente

set -e

echo "=========================================="
echo "🔧 CONFIGURAÇÃO DA VPS - ARK DEPLOY"
echo "=========================================="
echo ""

# Detectar IP do servidor
SERVER_IP=$(hostname -I | awk '{print $1}')
echo "📍 IP detectado: $SERVER_IP"
echo ""

# Verificar se .env existe
if [ ! -f ".env" ]; then
    echo "❌ Arquivo .env não encontrado!"
    echo "📝 Criando .env a partir do .env.example..."
    
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ Arquivo .env criado"
    else
        echo "❌ .env.example não encontrado!"
        exit 1
    fi
fi

echo "=========================================="
echo "1️⃣ Configurando NEXT_PUBLIC_API_URL"
echo "=========================================="
echo ""

# Perguntar ao usuário qual URL usar
echo "Escolha a URL da API:"
echo "1) http://api.$SERVER_IP.sslip.io/api (recomendado)"
echo "2) http://localhost:8001/api (apenas desenvolvimento)"
echo "3) Digitar manualmente"
echo ""
read -p "Opção [1]: " option
option=${option:-1}

case $option in
    1)
        API_URL="http://api.$SERVER_IP.sslip.io/api"
        ;;
    2)
        API_URL="http://localhost:8001/api"
        ;;
    3)
        read -p "Digite a URL da API: " API_URL
        ;;
    *)
        echo "❌ Opção inválida"
        exit 1
        ;;
esac

echo ""
echo "📝 Configurando: $API_URL"

# Verificar se NEXT_PUBLIC_API_URL já existe no .env
if grep -q "NEXT_PUBLIC_API_URL=" .env; then
    # Substituir linha existente
    sed -i "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=$API_URL|g" .env
    echo "✅ NEXT_PUBLIC_API_URL atualizado"
else
    # Adicionar nova linha
    echo "" >> .env
    echo "# API URL" >> .env
    echo "NEXT_PUBLIC_API_URL=$API_URL" >> .env
    echo "✅ NEXT_PUBLIC_API_URL adicionado"
fi

echo ""
echo "=========================================="
echo "2️⃣ Configurando SERVER_IP e FRONTEND_URL"
echo "=========================================="
echo ""

# Configurar SERVER_IP
if grep -q "SERVER_IP=" .env; then
    sed -i "s|SERVER_IP=.*|SERVER_IP=$SERVER_IP|g" .env
    echo "✅ SERVER_IP atualizado: $SERVER_IP"
else
    echo "SERVER_IP=$SERVER_IP" >> .env
    echo "✅ SERVER_IP adicionado: $SERVER_IP"
fi

# Configurar FRONTEND_URL
FRONTEND_URL="http://painel.$SERVER_IP.sslip.io"
if grep -q "FRONTEND_URL=" .env; then
    sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=$FRONTEND_URL|g" .env
    echo "✅ FRONTEND_URL atualizado: $FRONTEND_URL"
else
    echo "FRONTEND_URL=$FRONTEND_URL" >> .env
    echo "✅ FRONTEND_URL adicionado: $FRONTEND_URL"
fi

echo ""
echo "=========================================="
echo "3️⃣ Verificando configurações"
echo "=========================================="
echo ""

echo "📋 Configurações atuais:"
echo ""
grep "NEXT_PUBLIC_API_URL=" .env
grep "SERVER_IP=" .env
grep "FRONTEND_URL=" .env
echo ""

echo "=========================================="
echo "4️⃣ Rebuild do Frontend"
echo "=========================================="
echo ""

read -p "Deseja fazer rebuild do frontend agora? [S/n]: " rebuild
rebuild=${rebuild:-S}

if [[ $rebuild =~ ^[Ss]$ ]]; then
    echo ""
    echo "🛑 Parando containers..."
    docker-compose down
    
    echo ""
    echo "🗑️ Removendo imagem antiga do frontend..."
    docker rmi ark-deploy-frontend 2>/dev/null || true
    
    echo ""
    echo "🔨 Reconstruindo frontend..."
    docker-compose build --no-cache frontend
    
    echo ""
    echo "🚀 Iniciando containers..."
    docker-compose up -d
    
    echo ""
    echo "⏳ Aguardando containers iniciarem..."
    sleep 5
    
    echo ""
    echo "📊 Status dos containers:"
    docker-compose ps
    
    echo ""
    echo "🔍 Verificando logs do frontend..."
    docker-compose logs frontend | grep -i "api url" || echo "⚠️ Não foi possível verificar logs"
    
    echo ""
    echo "✅ Rebuild concluído!"
else
    echo ""
    echo "⚠️ Rebuild não executado."
    echo "📝 Para fazer rebuild manualmente, execute:"
    echo ""
    echo "   docker-compose down"
    echo "   docker-compose build --no-cache frontend"
    echo "   docker-compose up -d"
fi

echo ""
echo "=========================================="
echo "✅ CONFIGURAÇÃO CONCLUÍDA!"
echo "=========================================="
echo ""
echo "🌐 URLs de acesso:"
echo "   Frontend: $FRONTEND_URL"
echo "   API: $API_URL"
echo ""
echo "🔐 Credenciais do Super Admin:"
echo "   Email: superadmin@arkdeploy.com"
echo "   Senha: Admin123"
echo ""
echo "📝 Para mais informações, consulte:"
echo "   - CONFIGURACAO-VPS.md"
echo "   - GUIA-ATUALIZACAO-VPS.md"
echo ""
