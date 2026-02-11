#!/bin/bash

echo "🔧 Corrigindo configuração do Nginx..."
echo ""

# Detectar IP
SERVER_IP=$(curl -4 -s ifconfig.me 2>/dev/null || echo "38.242.213.195")
echo "✅ IP: $SERVER_IP"

# Remover configuração padrão
echo "🗑️  Removendo configuração padrão..."
rm -f /etc/nginx/sites-enabled/default

# Criar configuração correta
echo "📝 Criando configuração do proxy reverso..."
cat > /etc/nginx/sites-available/ark-deploy << 'EOF'
server {
    listen 80;
    server_name painel.38.242.213.195.sslip.io;

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
    server_name api.38.242.213.195.sslip.io;

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
EOF

# Ativar site
echo "🔗 Ativando site..."
ln -sf /etc/nginx/sites-available/ark-deploy /etc/nginx/sites-enabled/

# Testar configuração
echo "🧪 Testando configuração..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Configuração válida!"
    
    # Recarregar Nginx
    echo "🔄 Recarregando Nginx..."
    systemctl reload nginx
    
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo "✅ Nginx configurado com sucesso!"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    echo "🌐 Acesse o painel:"
    echo "   http://painel.38.242.213.195.sslip.io"
    echo ""
    echo "🔑 Login:"
    echo "   Email: admin@admin.com"
    echo "   Senha: admin123"
    echo ""
    echo "💡 Se ainda não tiver o usuário admin, execute:"
    echo "   cd /opt/ark-deploy"
    echo "   docker-compose exec backend node scripts/create-admin.js"
    echo ""
else
    echo "❌ Erro na configuração do Nginx"
    echo "Verifique os logs: tail -f /var/log/nginx/error.log"
    exit 1
fi
