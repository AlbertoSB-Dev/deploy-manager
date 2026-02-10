#!/bin/bash

# Deploy Manager - Instalação com Docker
# Este script instala o Deploy Manager usando Docker Compose

set -e

echo "🐳 Deploy Manager - Instalação Docker"
echo "======================================"
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "ℹ️  $1"
}

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then 
    print_error "Por favor, execute como root (sudo ./install-docker.sh)"
    exit 1
fi

# 1. Instalar Docker
print_info "1/5 Instalando Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
    rm get-docker.sh
    print_success "Docker instalado"
else
    print_success "Docker já instalado"
fi

# 2. Instalar Docker Compose
print_info "2/5 Instalando Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    print_success "Docker Compose instalado"
else
    print_success "Docker Compose já instalado"
fi

# 3. Criar rede do Traefik
print_info "3/5 Criando rede do Traefik..."
if ! docker network ls | grep -q coolify; then
    docker network create coolify
    print_success "Rede coolify criada"
else
    print_success "Rede coolify já existe"
fi

# 4. Configurar variáveis de ambiente
print_info "4/5 Configurando variáveis de ambiente..."

# Detectar IP público
PUBLIC_IP=$(curl -s ifconfig.me || echo "localhost")

# Gerar secrets
JWT_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 32)
MONGO_PASSWORD=$(openssl rand -base64 16)

# Criar arquivo .env
cat > .env << EOF
# MongoDB
MONGO_PASSWORD=$MONGO_PASSWORD

# Segurança
JWT_SECRET=$JWT_SECRET
ENCRYPTION_KEY=$ENCRYPTION_KEY

# Servidor
SERVER_IP=$PUBLIC_IP
BASE_DOMAIN=sslip.io
FRONTEND_URL=http://$PUBLIC_IP:8000

# GitHub OAuth (configurar depois)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=http://$PUBLIC_IP:8000/auth/github/callback
EOF

print_success "Arquivo .env criado"

# 5. Criar diretórios
print_info "5/5 Criando diretórios..."
mkdir -p /opt/projects
mkdir -p /opt/databases
mkdir -p /opt/backups
print_success "Diretórios criados"

echo ""
echo "======================================"
print_success "Instalação concluída!"
echo "======================================"
echo ""
echo "📋 Próximos passos:"
echo ""
echo "1. Inicie os containers:"
echo "   docker-compose up -d"
echo ""
echo "2. Aguarde os containers iniciarem (30-60 segundos)"
echo ""
echo "3. Crie o primeiro usuário admin:"
echo "   docker-compose exec backend node scripts/make-admin-auto.js"
echo ""
echo "4. Acesse o painel:"
echo "   http://$PUBLIC_IP:8000"
echo ""
echo "5. Configure GitHub OAuth (opcional):"
echo "   - Acesse: http://$PUBLIC_IP:8000/admin/settings"
echo "   - Configure as credenciais do GitHub"
echo ""
echo "📊 Comandos úteis:"
echo "   docker-compose logs -f          # Ver logs"
echo "   docker-compose ps               # Ver status"
echo "   docker-compose restart          # Reiniciar"
echo "   docker-compose down             # Parar tudo"
echo ""
