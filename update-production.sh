#!/bin/bash

# Script de Atualização em Produção
# Uso: ./update-production.sh [opcao]
# Opções: fast, clean, ultra-clean

set -e  # Para em caso de erro

echo "🚀 Iniciando atualização do Ark Deploy..."

# Ir para o diretório do projeto
cd /opt/ark-deploy || { echo "❌ Diretório /opt/ark-deploy não encontrado"; exit 1; }

# Verificar se há mudanças locais
if [[ -n $(git status -s) ]]; then
    echo "⚠️  Há mudanças locais não commitadas"
    read -p "Deseja descartar as mudanças? (s/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        git reset --hard
        git clean -fd
    else
        echo "❌ Atualização cancelada"
        exit 1
    fi
fi

# Fazer backup do .env
echo "💾 Fazendo backup do .env..."
cp backend/.env backend/.env.backup || true
cp frontend/.env.local frontend/.env.local.backup || true

# Puxar atualizações
echo "📥 Baixando atualizações do GitHub..."
git pull origin main

# Restaurar .env se necessário
if [ ! -f backend/.env ]; then
    echo "🔄 Restaurando .env do backend..."
    cp backend/.env.backup backend/.env || true
fi

if [ ! -f frontend/.env.local ]; then
    echo "🔄 Restaurando .env do frontend..."
    cp frontend/.env.local.backup frontend/.env.local || true
fi

# Parar containers
echo "🛑 Parando containers..."
docker-compose down

# Escolher tipo de atualização
OPTION=${1:-"normal"}

case $OPTION in
    fast)
        echo "⚡ Atualização rápida (sem rebuild completo)..."
        docker-compose up -d --build
        ;;
    
    clean)
        echo "🧹 Atualização limpa (rebuild completo)..."
        docker rmi ark-deploy-frontend ark-deploy-backend || true
        rm -rf frontend/.next backend/dist backend/node_modules/.cache || true
        docker-compose build --no-cache
        docker-compose up -d
        ;;
    
    ultra-clean)
        echo "🧹🧹 Atualização ultra-limpa (limpa tudo)..."
        docker-compose down -v
        docker system prune -af --volumes
        rm -rf frontend/.next backend/dist backend/node_modules/.cache || true
        docker-compose build --no-cache
        docker-compose up -d
        ;;
    
    *)
        echo "🔄 Atualização normal..."
        docker rmi ark-deploy-frontend ark-deploy-backend || true
        rm -rf frontend/.next backend/dist || true
        docker-compose build --no-cache
        docker-compose up -d
        ;;
esac

# Aguardar containers iniciarem
echo "⏳ Aguardando containers iniciarem..."
sleep 10

# Verificar status
echo ""
echo "📊 Status dos containers:"
docker-compose ps

# Verificar logs
echo ""
echo "📋 Últimas linhas dos logs:"
docker-compose logs --tail=20

echo ""
echo "✅ Atualização concluída!"
echo ""
echo "📝 Comandos úteis:"
echo "  - Ver logs: docker-compose logs -f"
echo "  - Ver status: docker-compose ps"
echo "  - Reiniciar: docker-compose restart"
echo "  - Parar: docker-compose down"
echo ""
