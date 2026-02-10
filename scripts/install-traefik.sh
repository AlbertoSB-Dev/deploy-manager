#!/bin/bash

# Script para Instalar Traefik
# Proxy reverso com SSL automático

set -e

echo "🚀 Instalando Traefik..."
echo ""

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado!"
    echo "   Instale o Docker primeiro: curl -fsSL https://get.docker.com | sh"
    exit 1
fi

# Verificar se Traefik já está rodando
if docker ps | grep -q "coolify-proxy\|traefik"; then
    echo "✅ Traefik já está rodando!"
    docker ps | grep -E "coolify-proxy|traefik"
    exit 0
fi

echo "📦 Instalando Traefik..."

# 1. Criar rede coolify
echo "🌐 Criando rede Docker 'coolify'..."
docker network create coolify 2>/dev/null || echo "   Rede já existe"

# 2. Criar diretórios
echo "📁 Criando diretórios..."
mkdir -p /opt/traefik/letsencrypt
touch /opt/traefik/letsencrypt/acme.json
chmod 600 /opt/traefik/letsencrypt/acme.json

# 3. Criar configuração do Traefik
echo "⚙️  Criando configuração..."
cat > /opt/traefik/traefik.toml << 'EOF'
# Traefik Configuration
[global]
  checkNewVersion = false
  sendAnonymousUsage = false

[log]
  level = "INFO"

[api]
  dashboard = true
  insecure = true

[entryPoints]
  [entryPoints.web]
    address = ":80"
    [entryPoints.web.http]
      [entryPoints.web.http.redirections]
        [entryPoints.web.http.redirections.entryPoint]
          to = "websecure"
          scheme = "https"
          permanent = true

  [entryPoints.websecure]
    address = ":443"

[providers]
  [providers.docker]
    endpoint = "unix:///var/run/docker.sock"
    exposedByDefault = false
    network = "coolify"
    watch = true

[certificatesResolvers.letsencrypt.acme]
  email = "admin@localhost"
  storage = "/letsencrypt/acme.json"
  [certificatesResolvers.letsencrypt.acme.httpChallenge]
    entryPoint = "web"
EOF

# 4. Parar containers na porta 80/443 se existirem
echo "🔍 Verificando portas 80 e 443..."
if netstat -tlnp 2>/dev/null | grep -q ":80 "; then
    echo "⚠️  Porta 80 em uso. Parando serviços..."
    systemctl stop nginx 2>/dev/null || true
    systemctl stop apache2 2>/dev/null || true
fi

# 5. Iniciar Traefik
echo "🐳 Iniciando Traefik..."
docker run -d \
  --name coolify-proxy \
  --restart unless-stopped \
  --network coolify \
  -p 80:80 \
  -p 443:443 \
  -p 8080:8080 \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  -v /opt/traefik/traefik.toml:/etc/traefik/traefik.toml:ro \
  -v /opt/traefik/letsencrypt:/letsencrypt \
  traefik:v2.10

# 6. Aguardar Traefik iniciar
echo "⏳ Aguardando Traefik iniciar..."
sleep 5

# 7. Verificar se está rodando
if docker ps | grep -q coolify-proxy; then
    echo ""
    echo "✅ Traefik instalado com sucesso!"
    echo ""
    echo "📊 Informações:"
    echo "   Container: coolify-proxy"
    echo "   Rede: coolify"
    echo "   Porta HTTP: 80"
    echo "   Porta HTTPS: 443"
    echo "   Dashboard: http://$(hostname -I | awk '{print $1}'):8080"
    echo ""
    echo "🔧 Como usar:"
    echo "   Adicione labels nos seus containers:"
    echo "   --label 'traefik.enable=true'"
    echo "   --label 'traefik.http.routers.myapp.rule=Host(\`myapp.example.com\`)'"
    echo "   --label 'traefik.http.services.myapp.loadbalancer.server.port=3000'"
    echo ""
    echo "📝 Exemplo completo:"
    echo "   docker run -d \\"
    echo "     --name myapp \\"
    echo "     --network coolify \\"
    echo "     --label 'traefik.enable=true' \\"
    echo "     --label 'traefik.http.routers.myapp.rule=Host(\`myapp.example.com\`)' \\"
    echo "     --label 'traefik.http.services.myapp.loadbalancer.server.port=3000' \\"
    echo "     nginx:alpine"
    echo ""
else
    echo "❌ Erro ao iniciar Traefik"
    echo "   Verifique os logs: docker logs coolify-proxy"
    exit 1
fi
