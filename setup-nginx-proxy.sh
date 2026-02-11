#!/bin/bash

echo "🔧 Configurando Nginx como Proxy Reverso..."
echo ""

# Detectar IP
SERVER_IP=$(curl -4 -s ifconfig.me)
echo "✅ IP detectado: $SERVER_IP"

# Instalar Nginx se não existir
if ! command -v nginx &> /dev/null; then
    echo "📦 Instalando Nginx..."
    apt-get update
    apt-get install -y nginx
    echo "✅ Nginx instalado"
else
    echo "✅ Nginx já instalado"
fi

# Criar configuração do Nginx para o painel
echo "📝 Criando configuração do Nginx..."
cat > /etc/nginx/sites-available/ark-deploy << EOF
# Frontend - painel.*.sslip.io
server {
    listen 80;
    server_name painel.$SERVER_IP.sslip.io painel.*.sslip.io;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}

# Backend API - api.*.sslip.io
server {
    listen 80;
    server_name api.$SERVER_IP.sslip.io api.*.sslip.io;

    location / {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Ativar site
ln -sf /etc/nginx/sites-available/ark-deploy /etc/nginx/sites-enabled/

# Remover configuração padrão se existir
rm -f /etc/nginx/sites-enabled/default

# Testar configuração
echo "🧪 Testando configuração do Nginx..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Configuração válida"
    
    # Reiniciar Nginx
    echo "🔄 Reiniciando Nginx..."
    systemctl restart nginx
    systemctl enable nginx
    
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo "✅ Nginx configurado com sucesso!"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    echo "🌐 Agora você pode acessar:"
    echo "   Frontend: http://painel.$SERVER_IP.sslip.io"
    echo "   Backend:  http://api.$SERVER_IP.sslip.io"
    echo ""
    echo "   Ou diretamente:"
    echo "   Frontend: http://$SERVER_IP:8000"
    echo "   Backend:  http://$SERVER_IP:8001"
    echo ""
else
    echo "❌ Erro na configuração do Nginx"
    exit 1
fi
