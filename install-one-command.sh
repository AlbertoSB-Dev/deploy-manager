#!/bin/bash

# 🚀 Ark Deploy - Instalação em 1 Comando
# Uso: curl -fsSL https://raw.githubusercontent.com/AlbertoSB-Dev/deploy-manager/main/install-one-command.sh | bash

set -e

echo "🚀 Instalando Ark Deploy..."
echo ""

# Detectar IP público automaticamente
echo "🔍 Detectando IP público..."
SERVER_IP=$(curl -s ifconfig.me || curl -s icanhazip.com || curl -s ipinfo.io/ip)
echo "✅ IP detectado: $SERVER_IP"
echo ""

# Instalar Docker se não existir
if ! command -v docker &> /dev/null; then
    echo "📦 Instalando Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl start docker
    systemctl enable docker
    echo "✅ Docker instalado"
else
    echo "✅ Docker já instalado"
fi

# Instalar Docker Compose se não existir
if ! command -v docker-compose &> /dev/null; then
    echo "📦 Instalando Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose instalado"
else
    echo "✅ Docker Compose já instalado"
fi

echo ""

# Clonar repositório
echo "📥 Clonando repositório..."
cd /opt
rm -rf deploy-manager ark-deploy 2>/dev/null || true
git clone https://github.com/AlbertoSB-Dev/deploy-manager.git ark-deploy
cd ark-deploy

# Gerar chaves seguras
echo "🔐 Gerando chaves de segurança..."
JWT_SECRET=$(openssl rand -hex 64)
ENCRYPTION_KEY=$(openssl rand -hex 16)

# Criar arquivo .env
echo "📝 Configurando variáveis de ambiente..."
cat > .env << EOF
# Backend
PORT=8001
NODE_ENV=production
MONGODB_URI=mongodb://mongodb:27017/ark-deploy
JWT_SECRET=$JWT_SECRET
ENCRYPTION_KEY=$ENCRYPTION_KEY
PROJECTS_DIR=/opt/projects
BASE_DOMAIN=sslip.io
SERVER_IP=$SERVER_IP
FRONTEND_URL=http://painel.$SERVER_IP.sslip.io
GITHUB_CALLBACK_URL=http://painel.$SERVER_IP.sslip.io/auth/github/callback
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Frontend
NEXT_PUBLIC_API_URL=http://api.$SERVER_IP.sslip.io/api
NEXT_PUBLIC_FRONTEND_URL=http://painel.$SERVER_IP.sslip.io
EOF

echo "✅ Variáveis configuradas"
echo ""

# Iniciar containers
echo "🐳 Iniciando containers..."
docker-compose up -d

# Aguardar containers iniciarem
echo "⏳ Aguardando containers iniciarem..."
sleep 15

# Criar usuário admin
echo "👤 Criando usuário admin..."
docker-compose exec -T backend node scripts/make-admin-auto.js || true

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ Ark Deploy instalado com sucesso!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "🌐 Acesse o painel em:"
echo "   Frontend: http://painel.$SERVER_IP.sslip.io"
echo "   Backend:  http://api.$SERVER_IP.sslip.io"
echo ""
echo "🔑 Login padrão:"
echo "   Email: admin@admin.com"
echo "   Senha: admin123"
echo ""
echo "📝 Comandos úteis:"
echo "   Ver logs:      cd /opt/ark-deploy && docker-compose logs -f"
echo "   Reiniciar:     cd /opt/ark-deploy && docker-compose restart"
echo "   Parar:         cd /opt/ark-deploy && docker-compose down"
echo "   Atualizar:     cd /opt/ark-deploy && git pull && docker-compose up -d --build"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   1. Configure GitHub OAuth em: https://github.com/settings/developers"
echo "   2. Edite /opt/ark-deploy/.env e adicione GITHUB_CLIENT_ID e GITHUB_CLIENT_SECRET"
echo "   3. Reinicie: docker-compose restart"
echo ""
echo "═══════════════════════════════════════════════════════════"
