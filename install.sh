#!/bin/bash

# Deploy Manager - Script de Instalação Automática
# Este script instala todas as dependências necessárias

set -e

echo "🚀 Deploy Manager - Instalação Automática"
echo "=========================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para imprimir mensagens coloridas
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
    print_error "Por favor, execute como root (sudo ./install.sh)"
    exit 1
fi

# Detectar sistema operacional
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    VERSION=$VERSION_ID
else
    print_error "Sistema operacional não suportado"
    exit 1
fi

print_info "Sistema detectado: $OS $VERSION"
echo ""

# 1. Atualizar sistema
print_info "1/10 Atualizando sistema..."
if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    apt-get update -qq
    apt-get upgrade -y -qq
elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ]; then
    yum update -y -q
fi
print_success "Sistema atualizado"

# 2. Instalar Docker
print_info "2/10 Instalando Docker..."
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

# 3. Instalar Docker Compose
print_info "3/10 Instalando Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    print_success "Docker Compose instalado"
else
    print_success "Docker Compose já instalado"
fi

# 4. Instalar Node.js
print_info "4/10 Instalando Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    print_success "Node.js instalado"
else
    print_success "Node.js já instalado ($(node -v))"
fi

# 5. Instalar MongoDB
print_info "5/10 Instalando MongoDB..."
if ! systemctl is-active --quiet mongod; then
    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg
        echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
        apt-get update -qq
        apt-get install -y mongodb-org
        systemctl enable mongod
        systemctl start mongod
    fi
    print_success "MongoDB instalado"
else
    print_success "MongoDB já instalado"
fi

# 6. Instalar Traefik
print_info "6/10 Instalando Traefik..."
bash scripts/install-traefik.sh
print_success "Traefik instalado"

# 7. Configurar firewall
print_info "7/10 Configurando firewall..."
if command -v ufw &> /dev/null; then
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 8000/tcp
    ufw allow 8001/tcp
    ufw --force enable
    print_success "Firewall configurado"
else
    print_warning "UFW não encontrado, configure o firewall manualmente"
fi

# 8. Criar diretórios necessários
print_info "8/10 Criando diretórios..."
mkdir -p /opt/deploy-manager
mkdir -p /opt/projects
mkdir -p /opt/databases
mkdir -p /opt/backups
mkdir -p /var/log/deploy-manager
print_success "Diretórios criados"

# 9. Configurar variáveis de ambiente
print_info "9/10 Configurando variáveis de ambiente..."

# Detectar IP público
PUBLIC_IP=$(curl -s ifconfig.me || echo "localhost")

# Gerar secrets aleatórios
JWT_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 32)

# Criar arquivo .env se não existir
if [ ! -f backend/.env ]; then
    cat > backend/.env << EOF
PORT=8001
MONGODB_URI=mongodb://localhost:27017/deploy-manager
JWT_SECRET=$JWT_SECRET
ENCRYPTION_KEY=$ENCRYPTION_KEY

# Diretórios e Configurações
PROJECTS_DIR=/opt/projects
BASE_DOMAIN=sslip.io
SERVER_IP=$PUBLIC_IP
NODE_ENV=production

# GitHub OAuth (configurar depois)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# URLs do Frontend
FRONTEND_URL=http://$PUBLIC_IP:8000
GITHUB_CALLBACK_URL=http://$PUBLIC_IP:8000/auth/github/callback
EOF
    print_success "Arquivo .env criado"
else
    print_success "Arquivo .env já existe"
fi

# 10. Instalar dependências do projeto
print_info "10/10 Instalando dependências do projeto..."
cd backend && npm install --production && cd ..
cd frontend && npm install && npm run build && cd ..
print_success "Dependências instaladas"

echo ""
echo "=========================================="
print_success "Instalação concluída com sucesso!"
echo "=========================================="
echo ""
echo "📋 Próximos passos:"
echo ""
echo "1. Configure o GitHub OAuth (opcional):"
echo "   - Acesse: https://github.com/settings/developers"
echo "   - Crie um novo OAuth App"
echo "   - Callback URL: http://$PUBLIC_IP:8000/auth/github/callback"
echo "   - Adicione as credenciais no arquivo backend/.env"
echo ""
echo "2. Inicie o backend:"
echo "   cd backend && npm run dev"
echo ""
echo "3. Inicie o frontend:"
echo "   cd frontend && npm run dev"
echo ""
echo "4. Acesse o painel:"
echo "   http://$PUBLIC_IP:8000"
echo ""
echo "5. Crie o primeiro usuário admin:"
echo "   cd backend && node scripts/make-admin-auto.js"
echo ""
echo "📚 Documentação: README.md"
echo "🐛 Problemas? Abra uma issue no GitHub"
echo ""
