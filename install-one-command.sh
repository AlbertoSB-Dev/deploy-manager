#!/bin/bash

# 🚀 Ark Deploy - Instalação em 1 Comando
# Uso: curl -fsSL https://raw.githubusercontent.com/AlbertoSB-Dev/deploy-manager/main/install-one-command.sh | bash

set -e

echo "🚀 Instalando Ark Deploy..."
echo ""

# Detectar IP público automaticamente (IPv4)
echo "🔍 Detectando IP público..."
SERVER_IP=$(curl -4 -s ifconfig.me || curl -4 -s icanhazip.com || curl -4 -s ipinfo.io/ip || hostname -I | awk '{print $1}')
echo "✅ IP detectado: $SERVER_IP"
echo ""

# Instalar Docker se não existir
if ! command -v docker &> /dev/null; then
    echo "📦 Instalando Docker..."
    curl -fsSL https://get.docker.com | sh
    echo "✅ Docker instalado"
else
    echo "✅ Docker já instalado"
fi

# Garantir que Docker está rodando
echo "🔄 Iniciando Docker daemon..."
systemctl start docker 2>/dev/null || service docker start 2>/dev/null || true
systemctl enable docker 2>/dev/null || true
sleep 3

# Verificar se Docker está funcionando
if ! docker ps &> /dev/null; then
    echo "❌ Erro: Docker não está rodando"
    echo "Execute manualmente: systemctl start docker"
    exit 1
fi
echo "✅ Docker rodando"

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

# Criar rede Docker coolify
echo "🌐 Criando rede Docker..."
docker network create coolify 2>/dev/null || echo "✅ Rede coolify já existe"
echo ""

# Configurar Nginx como proxy reverso
echo "🔧 Configurando Nginx..."
if ! command -v nginx &> /dev/null; then
    apt-get update -qq
    apt-get install -y nginx
fi

# Remover configuração padrão
rm -f /etc/nginx/sites-enabled/default

# Criar configuração do Nginx
cat > /etc/nginx/sites-available/ark-deploy << 'NGINX_EOF'
server {
    listen 80;
    server_name painel.SERVER_IP_PLACEHOLDER.sslip.io;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name api.SERVER_IP_PLACEHOLDER.sslip.io;

    location / {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX_EOF

# Substituir placeholder pelo IP real
sed -i "s/SERVER_IP_PLACEHOLDER/$SERVER_IP/g" /etc/nginx/sites-available/ark-deploy

# Ativar site
ln -sf /etc/nginx/sites-available/ark-deploy /etc/nginx/sites-enabled/

# Testar e reiniciar Nginx
if nginx -t 2>/dev/null; then
    systemctl restart nginx 2>/dev/null
    systemctl enable nginx 2>/dev/null
    echo "✅ Nginx configurado"
else
    echo "⚠️  Nginx com erro, mas continuando..."
fi
echo ""

# Iniciar containers
echo "🐳 Iniciando containers..."
docker-compose up -d

# Aguardar containers iniciarem
echo "⏳ Aguardando containers iniciarem..."
sleep 15

# Criar usuário admin
echo "👤 Criando usuário admin..."
sleep 5  # Aguardar MongoDB estar pronto
docker-compose exec -T backend node scripts/create-admin.js || {
    echo "⚠️  Erro ao criar admin automaticamente"
    echo "   Execute manualmente: docker-compose exec backend node scripts/create-admin.js"
}

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ Ark Deploy instalado com sucesso!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "🌐 Acesse o painel:"
echo "   Com domínio:  http://painel.$SERVER_IP.sslip.io"
echo "   Direto (IP):  http://$SERVER_IP:8000"
echo ""
echo "� API Backend:"
echo "   Com domínio:  http://api.$SERVER_IP.sslip.io"
echo "   Direto (IP):  http://$SERVER_IP:8001"
echo ""
echo "� Login padrão:"
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
