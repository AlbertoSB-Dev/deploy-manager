#!/bin/bash

set -e

echo "🚀 Instalando Ark Deploy (Modo Simples)..."
echo ""

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Por favor, execute como root (sudo)${NC}"
    exit 1
fi

# Obter IP do servidor
echo -e "${BLUE}📡 Detectando IP do servidor...${NC}"
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s icanhazip.com 2>/dev/null || hostname -I | awk '{print $1}')
echo -e "${GREEN}✅ IP detectado: ${SERVER_IP}${NC}"

# 1. Instalar Docker
echo -e "${BLUE}📦 Verificando Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo "Instalando Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    systemctl enable docker
    systemctl start docker
    echo -e "${GREEN}✅ Docker instalado${NC}"
else
    echo -e "${GREEN}✅ Docker já instalado${NC}"
fi

# 2. Instalar Docker Compose
echo -e "${BLUE}📦 Verificando Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    echo "Instalando Docker Compose..."
    COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d'"' -f4)
    curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✅ Docker Compose instalado${NC}"
else
    echo -e "${GREEN}✅ Docker Compose já instalado${NC}"
fi

# 3. Criar redes Docker
echo -e "${BLUE}🔧 Criando redes Docker...${NC}"
docker network create coolify 2>/dev/null && echo -e "${GREEN}✅ Rede coolify criada${NC}" || echo -e "${YELLOW}⚠️  Rede coolify já existe${NC}"
docker network create ark-deploy-network 2>/dev/null && echo -e "${GREEN}✅ Rede ark-deploy-network criada${NC}" || echo -e "${YELLOW}⚠️  Rede ark-deploy-network já existe${NC}"

# 4. Configurar firewall
echo -e "${BLUE}🔥 Configurando firewall...${NC}"
if command -v ufw &> /dev/null; then
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 8000/tcp
    ufw allow 3000/tcp
    ufw allow 8001/tcp
    echo -e "${GREEN}✅ Firewall configurado${NC}"
else
    echo -e "${YELLOW}⚠️  UFW não encontrado, pulando configuração de firewall${NC}"
fi

# 5. Gerar secrets
echo -e "${BLUE}🔐 Gerando secrets...${NC}"
JWT_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 32)
MONGO_PASSWORD=$(openssl rand -base64 16)

# 6. Criar arquivo .env
echo -e "${BLUE}📝 Criando arquivo .env...${NC}"
cat > .env << EOF
# MongoDB
MONGO_PASSWORD=${MONGO_PASSWORD}

# JWT & Encryption
JWT_SECRET=${JWT_SECRET}
ENCRYPTION_KEY=${ENCRYPTION_KEY}

# Server Config
SERVER_IP=${SERVER_IP}
BASE_DOMAIN=sslip.io
FRONTEND_URL=http://${SERVER_IP}:8000

# GitHub OAuth (opcional - configure depois)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=http://${SERVER_IP}:8000/auth/github/callback
EOF

echo -e "${GREEN}✅ Arquivo .env criado${NC}"

# 7. Criar diretórios necessários
echo -e "${BLUE}📁 Criando diretórios...${NC}"
mkdir -p /opt/projects
mkdir -p /opt/databases
mkdir -p /opt/backups
chmod 755 /opt/projects /opt/databases /opt/backups
echo -e "${GREEN}✅ Diretórios criados${NC}"

# 8. Parar containers antigos (se existirem)
echo -e "${BLUE}🛑 Parando containers antigos...${NC}"
docker-compose down 2>/dev/null || true

# 9. Iniciar containers (SEM BUILD)
echo -e "${BLUE}🐳 Iniciando containers...${NC}"
docker-compose up -d --no-build

# 10. Aguardar containers iniciarem
echo -e "${BLUE}⏳ Aguardando containers iniciarem...${NC}"
sleep 15

# 11. Verificar status
echo -e "${BLUE}📊 Verificando status dos containers...${NC}"
docker-compose ps

# 12. Criar usuário admin
echo -e "${BLUE}👤 Criando usuário admin...${NC}"
sleep 5
docker-compose exec -T backend node scripts/make-admin-auto.js 2>/dev/null || echo -e "${YELLOW}⚠️  Usuário admin será criado na primeira execução${NC}"

echo ""
echo -e "${GREEN}✅ ============================================${NC}"
echo -e "${GREEN}✅ Instalação concluída com sucesso!${NC}"
echo -e "${GREEN}✅ ============================================${NC}"
echo ""
echo -e "${BLUE}📍 Acesse o painel em:${NC}"
echo -e "   ${GREEN}http://${SERVER_IP}:8000${NC}"
echo ""
echo -e "${BLUE}🔑 Credenciais padrão:${NC}"
echo -e "   Email: ${GREEN}admin@admin.com${NC}"
echo -e "   Senha: ${GREEN}admin123${NC}"
echo ""
echo -e "${BLUE}📝 Comandos úteis:${NC}"
echo -e "   Ver logs:      ${GREEN}docker-compose logs -f${NC}"
echo -e "   Reiniciar:     ${GREEN}docker-compose restart${NC}"
echo -e "   Parar:         ${GREEN}docker-compose down${NC}"
echo -e "   Status:        ${GREEN}docker-compose ps${NC}"
echo -e "   Atualizar:     ${GREEN}./update.sh${NC}"
echo ""
echo -e "${RED}⚠️  IMPORTANTE: Troque a senha padrão após o primeiro login!${NC}"
echo ""
