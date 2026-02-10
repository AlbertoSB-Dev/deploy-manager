#!/bin/bash

# Script de Provisioning Otimizado para Baixa Memória
# Para servidores com 512MB - 1GB RAM

set -e

echo "🚀 Iniciando provisioning otimizado para baixa memória..."
echo ""

# Verificar memória disponível
TOTAL_MEM=$(free -m | awk '/^Mem:/{print $2}')
echo "💾 Memória total: ${TOTAL_MEM}MB"

if [ $TOTAL_MEM -lt 1024 ]; then
    echo "⚠️  Memória baixa detectada. Criando SWAP..."
    
    # Criar SWAP se não existir
    if [ ! -f /swapfile ]; then
        echo "📝 Criando arquivo SWAP de 2GB..."
        fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
        chmod 600 /swapfile
        mkswap /swapfile
        swapon /swapfile
        echo '/swapfile none swap sw 0 0' >> /etc/fstab
        echo "✅ SWAP criado e ativado"
    else
        echo "✅ SWAP já existe"
        swapon /swapfile 2>/dev/null || true
    fi
    
    # Verificar SWAP
    echo "💾 Memória após SWAP:"
    free -h
    echo ""
fi

# Limpar cache e memória
echo "🧹 Limpando cache..."
apt-get clean
apt-get autoclean
sync
echo 3 > /proc/sys/vm/drop_caches 2>/dev/null || true

# Parar serviços desnecessários temporariamente
echo "⏸️  Parando serviços temporariamente..."
systemctl stop snapd 2>/dev/null || true
systemctl stop unattended-upgrades 2>/dev/null || true

# Atualizar lista de pacotes
echo "📦 Atualizando lista de pacotes..."
apt-get update -qq

# Instalar pacotes em grupos pequenos (reduz uso de memória)
echo "📦 Instalando dependências (grupo 1/4)..."
apt-get install -y -qq apt-transport-https ca-certificates

echo "📦 Instalando dependências (grupo 2/4)..."
apt-get install -y -qq curl gnupg

echo "📦 Instalando dependências (grupo 3/4)..."
apt-get install -y -qq lsb-release git

echo "📦 Instalando dependências (grupo 4/4)..."
apt-get install -y -qq wget unzip

# Limpar cache novamente
apt-get clean

echo ""
echo "✅ Dependências básicas instaladas"
echo ""

# Docker
if ! command -v docker &> /dev/null; then
    echo "🐳 Instalando Docker..."
    
    # Adicionar repositório Docker
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    apt-get update -qq
    
    # Instalar Docker em partes
    echo "  Instalando containerd..."
    apt-get install -y -qq containerd.io
    
    echo "  Instalando docker-ce-cli..."
    apt-get install -y -qq docker-ce-cli
    
    echo "  Instalando docker-ce..."
    apt-get install -y -qq docker-ce
    
    echo "  Instalando docker-compose-plugin..."
    apt-get install -y -qq docker-compose-plugin
    
    systemctl enable docker
    systemctl start docker
    
    echo "✅ Docker instalado"
else
    echo "✅ Docker já instalado"
fi

# Node.js
if ! command -v node &> /dev/null; then
    echo "📦 Instalando Node.js..."
    
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y -qq nodejs
    
    echo "✅ Node.js instalado"
else
    echo "✅ Node.js já instalado"
fi

# Nginx
if ! command -v nginx &> /dev/null; then
    echo "🌐 Instalando Nginx..."
    apt-get install -y -qq nginx
    systemctl enable nginx
    systemctl start nginx
    echo "✅ Nginx instalado"
else
    echo "✅ Nginx já instalado"
fi

# Configurar SFTP (OpenSSH Server)
echo "🔐 Configurando SFTP..."
if ! grep -q "Subsystem sftp" /etc/ssh/sshd_config; then
    echo "  Habilitando subsistema SFTP..."
    echo "" >> /etc/ssh/sshd_config
    echo "# SFTP Subsystem - Deploy Manager" >> /etc/ssh/sshd_config
    echo "Subsystem sftp /usr/lib/openssh/sftp-server" >> /etc/ssh/sshd_config
    systemctl restart sshd
    echo "✅ SFTP habilitado"
else
    echo "✅ SFTP já está habilitado"
fi

# Limpar tudo
echo "🧹 Limpeza final..."
apt-get autoremove -y -qq
apt-get clean
sync
echo 3 > /proc/sys/vm/drop_caches 2>/dev/null || true

# Reativar serviços
echo "▶️  Reativando serviços..."
systemctl start unattended-upgrades 2>/dev/null || true
systemctl start snapd 2>/dev/null || true

# Verificar instalações
echo ""
echo "🔍 Verificando instalações..."
echo "  Docker: $(docker --version 2>/dev/null || echo 'Não instalado')"
echo "  Node.js: $(node --version 2>/dev/null || echo 'Não instalado')"
echo "  npm: $(npm --version 2>/dev/null || echo 'Não instalado')"
echo "  Nginx: $(nginx -v 2>&1 || echo 'Não instalado')"

echo ""
echo "💾 Uso de memória final:"
free -h

echo ""
echo "✅ Provisioning concluído com sucesso!"
echo ""
