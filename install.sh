#!/bin/bash

# Ark Deploy - Instalação Completa Automatizada
# Este script instala TUDO e deixa rodando em Docker

set -e

echo "🚀 Ark Deploy - Instalação Completa"
echo "========================================"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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
    echo -e "${BLUE}ℹ️  $1${NC}"
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
print_info "1/8 Atualizando sistema..."
if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    apt-get update -qq
    apt-get upgrade -y -qq
elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ]; then
    yum update -y -q
fi
print_success "Sistema atualizado"

# 2. Instalar Docker
print_info "2/8 Instalando Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
    rm get-docker.sh
    print_success "Docker instalado"
else
    print_success "Docker já instalado ($(docker --version))"
fi

# 3. Instalar Docker Compose
print_info "3/8 Instalando Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    print_success "Docker Compose instalado"
else
    print_success "Docker Compose já instalado ($(docker-compose --version))"
fi

# 4. Criar rede do Traefik
print_info "4/8 Criando rede do Traefik..."
if ! docker network ls | grep -q coolify; then
    docker network create coolify
    print_success "Rede coolify criada"
else
    print_success "Rede coolify já existe"
fi

# 5. Configurar firewall
print_info "5/8 Configurando firewall..."
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

# 6. Criar diretórios necessários
print_info "6/8 Criando diretórios..."
mkdir -p /opt/deploy-manager
mkdir -p /opt/projects
mkdir -p /opt/databases
mkdir -p /opt/backups
mkdir -p /var/log/deploy-manager
print_success "Diretórios criados"

# 7. Configurar variáveis de ambiente
print_info "7/8 Configurando variáveis de ambiente..."

# Detectar IP público
PUBLIC_IP=$(curl -s ifconfig.me || echo "localhost")

# Gerar secrets aleatórios
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

# GitHub OAuth (configurar depois no painel)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=http://$PUBLIC_IP:8000/auth/github/callback
EOF

print_success "Arquivo .env criado com secrets gerados"

# 8. Iniciar containers Docker
print_info "8/8 Iniciando containers Docker..."
print_info "Isso pode levar alguns minutos na primeira vez..."

# Build e start dos containers
docker-compose up -d --build

# Aguardar containers iniciarem
print_info "Aguardando containers iniciarem..."
sleep 30

# Verificar se containers estão rodando
if docker-compose ps | grep -q "Up"; then
    print_success "Containers iniciados com sucesso!"
else
    print_error "Erro ao iniciar containers"
    docker-compose logs
    exit 1
fi

# Criar usuário admin automaticamente
print_info "Criando usuário admin..."
sleep 10  # Aguardar MongoDB inicializar completamente

# Tentar criar admin (pode falhar se já existir)
docker-compose exec -T backend node scripts/make-admin-auto.js || print_warning "Admin já existe ou erro ao criar"

echo ""
echo "========================================"
print_success "🎉 Instalação concluída com sucesso!"
echo "========================================"
echo ""
echo "📋 Informações do Sistema:"
echo ""
echo "🌐 Acesse o painel:"
echo "   http://$PUBLIC_IP:8000"
echo "   http://ark-deploy.$PUBLIC_IP.sslip.io (via Traefik)"
echo ""
echo "👤 Credenciais padrão:"
echo "   Email: admin@admin.com"
echo "   Senha: admin123"
echo ""
echo "⚙️  Configurações:"
echo "   - Acesse: http://$PUBLIC_IP:8000/admin/settings"
echo "   - Configure GitHub OAuth (opcional)"
echo "   - Altere a senha padrão"
echo "   - Atualize o sistema diretamente do GitHub"
echo ""
echo "🔄 Sistema de Atualização:"
echo "   - Acesse Admin > Configurações"
echo "   - Clique em 'Atualizar Sistema'"
echo "   - O painel será atualizado automaticamente do GitHub"
echo ""
echo "📊 Comandos úteis:"
echo "   docker-compose logs -f          # Ver logs em tempo real"
echo "   docker-compose ps               # Ver status dos containers"
echo "   docker-compose restart          # Reiniciar serviços"
echo "   docker-compose down             # Parar tudo"
echo "   docker-compose up -d            # Iniciar novamente"
echo ""
echo "🔧 Gerenciar usuários:"
echo "   docker-compose exec backend node scripts/make-admin.js"
echo "   docker-compose exec backend node scripts/reset-password.js"
echo ""
echo "📚 Documentação: README.md"
echo "🐛 Problemas? Verifique os logs: docker-compose logs"
echo ""
print_success "Ark Deploy está rodando! 🚀"
echo ""
