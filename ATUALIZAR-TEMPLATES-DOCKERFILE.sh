#!/bin/bash

# Script para atualizar VPS com sistema de templates de Dockerfile
# Data: 14/02/2026

echo "🚀 Atualizando VPS com Sistema de Templates de Dockerfile"
echo "=========================================================="
echo ""

# Configurações
VPS_USER="root"
VPS_HOST="38.242.213.195"
VPS_PATH="/opt/ark-deploy"

echo "📋 Resumo da atualização:"
echo "  - Sistema de templates de Dockerfile implementado"
echo "  - 5 templates prontos: Node.js, Next.js, React CRA, Python Flask, Django"
echo "  - UI para seleção de template no formulário"
echo "  - Detecção automática como fallback"
echo "  - Correção do problema Guru-TI (modo dev → produção)"
echo ""

# Passo 1: Commit local
echo "📝 Passo 1: Fazendo commit das alterações..."
git add .
git commit -m "feat: Sistema de templates de Dockerfile

- Adicionadas rotas GET /api/projects/dockerfile-templates
- Adicionada rota GET /api/projects/dockerfile-templates/:id
- Campo dockerfileTemplate no modelo Project
- Integração com DockerfileTemplateService no DeployService
- UI de seleção de template no CreateProjectWithGitHub
- Modal de preview de template
- 5 templates prontos: nodejs, nextjs, react-cra, python-flask, python-django
- Detecção automática baseada em package.json e requirements.txt
- Correção do problema Guru-TI rodando em modo desenvolvimento

Arquivos modificados:
- backend/src/routes/projects.ts
- backend/src/models/Project.ts
- backend/src/services/DeployService.ts
- frontend/src/components/CreateProjectWithGitHub.tsx

Arquivos criados:
- DOCKERFILE-TEMPLATES-IMPLEMENTATION.md
- ATUALIZAR-TEMPLATES-DOCKERFILE.sh"

if [ $? -eq 0 ]; then
    echo "✅ Commit realizado com sucesso"
else
    echo "⚠️  Nada para commitar ou erro no commit"
fi
echo ""

# Passo 2: Push para repositório
echo "📤 Passo 2: Enviando para repositório remoto..."
git push origin main

if [ $? -eq 0 ]; then
    echo "✅ Push realizado com sucesso"
else
    echo "❌ Erro no push - verifique sua conexão e credenciais"
    exit 1
fi
echo ""

# Passo 3: Conectar na VPS e atualizar
echo "🌐 Passo 3: Conectando na VPS e atualizando..."
echo ""

ssh ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
    echo "📍 Conectado na VPS"
    echo ""
    
    # Navegar para diretório
    cd /opt/ark-deploy
    echo "📂 Diretório: $(pwd)"
    echo ""
    
    # Pull das alterações
    echo "📥 Baixando atualizações do Git..."
    git pull origin main
    
    if [ $? -ne 0 ]; then
        echo "❌ Erro ao fazer git pull"
        exit 1
    fi
    echo "✅ Git pull concluído"
    echo ""
    
    # Verificar se templates existem
    echo "🔍 Verificando templates..."
    if [ -d "backend/src/templates/dockerfiles" ]; then
        echo "✅ Pasta de templates encontrada"
        ls -la backend/src/templates/dockerfiles/
    else
        echo "⚠️  Pasta de templates não encontrada"
    fi
    echo ""
    
    # Rebuild e restart dos containers
    echo "🔨 Reconstruindo e reiniciando containers..."
    docker-compose -f docker-compose.prod.yml up -d --build
    
    if [ $? -ne 0 ]; then
        echo "❌ Erro ao rebuildar containers"
        exit 1
    fi
    echo "✅ Containers reconstruídos e reiniciados"
    echo ""
    
    # Aguardar containers iniciarem
    echo "⏳ Aguardando containers iniciarem (15 segundos)..."
    sleep 15
    echo ""
    
    # Verificar status
    echo "📊 Status dos containers:"
    docker-compose -f docker-compose.prod.yml ps
    echo ""
    
    # Verificar logs do backend
    echo "📋 Últimas linhas do log do backend:"
    docker-compose -f docker-compose.prod.yml logs --tail=20 backend
    echo ""
    
    echo "✅ Atualização da VPS concluída!"
    echo ""
    echo "🎯 Próximos passos:"
    echo "  1. Acesse: http://painel.38.242.213.195.sslip.io"
    echo "  2. Faça login com: superadmin@arkdeploy.com / Admin123"
    echo "  3. Crie um novo projeto"
    echo "  4. Teste a seleção de templates de Dockerfile"
    echo "  5. Faça deploy e observe os logs"
    echo ""
    echo "🐛 Para testar correção do Guru-TI:"
    echo "  1. Crie projeto React CRA"
    echo "  2. Selecione template 'React (Create React App)'"
    echo "  3. Deploy deve rodar em modo produção com Nginx"
    echo ""
ENDSSH

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================================="
    echo "✅ ATUALIZAÇÃO COMPLETA!"
    echo "=========================================================="
    echo ""
    echo "📝 Resumo:"
    echo "  ✅ Commit local realizado"
    echo "  ✅ Push para repositório"
    echo "  ✅ Pull na VPS"
    echo "  ✅ Containers reconstruídos"
    echo "  ✅ Sistema de templates ativo"
    echo ""
    echo "🌐 Acesse: http://painel.38.242.213.195.sslip.io"
    echo ""
else
    echo ""
    echo "❌ Erro durante atualização da VPS"
    echo "Verifique os logs acima para mais detalhes"
    exit 1
fi
