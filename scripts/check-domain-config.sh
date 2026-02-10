#!/bin/bash

# Script para verificar configuração de domínio customizado

echo "🔍 Verificando Configuração de Domínio"
echo "======================================"
echo ""

# Verificar se Traefik está rodando
echo "1️⃣ Verificando Traefik..."
if docker ps | grep -q traefik; then
    echo "✅ Traefik está rodando"
    
    # Verificar portas do Traefik
    echo ""
    echo "📡 Portas do Traefik:"
    docker ps --filter "name=traefik" --format "table {{.Names}}\t{{.Ports}}"
    
    # Verificar se está escutando na porta 80
    if docker ps --filter "name=traefik" --format "{{.Ports}}" | grep -q "0.0.0.0:80"; then
        echo "✅ Traefik escutando na porta 80"
    else
        echo "❌ Traefik NÃO está escutando na porta 80"
        echo "   Domínios customizados não funcionarão!"
    fi
    
    # Verificar se está escutando na porta 443
    if docker ps --filter "name=traefik" --format "{{.Ports}}" | grep -q "0.0.0.0:443"; then
        echo "✅ Traefik escutando na porta 443 (HTTPS)"
    else
        echo "⚠️  Traefik NÃO está escutando na porta 443"
        echo "   HTTPS não funcionará"
    fi
else
    echo "❌ Traefik NÃO está rodando"
    echo "   Execute: bash scripts/install-traefik.sh"
fi

echo ""
echo "2️⃣ Verificando Rede do Traefik..."
NETWORK=$(docker network ls --filter "name=coolify" --format "{{.Name}}" | head -n 1)
if [ -z "$NETWORK" ]; then
    NETWORK=$(docker network ls --filter "name=deploy-manager" --format "{{.Name}}" | head -n 1)
fi

if [ -n "$NETWORK" ]; then
    echo "✅ Rede encontrada: $NETWORK"
    
    # Listar containers na rede
    echo ""
    echo "📦 Containers na rede $NETWORK:"
    docker network inspect $NETWORK --format '{{range .Containers}}{{.Name}} {{end}}' | tr ' ' '\n' | grep -v '^$'
else
    echo "❌ Nenhuma rede encontrada"
fi

echo ""
echo "3️⃣ Verificando Projetos com Domínio..."
echo ""
docker ps --format "table {{.Names}}\t{{.Labels}}" | grep "traefik.http.routers" | while read line; do
    CONTAINER=$(echo $line | awk '{print $1}')
    DOMAIN=$(docker inspect $CONTAINER --format '{{index .Config.Labels "traefik.http.routers.'$CONTAINER'.rule"}}' 2>/dev/null)
    PORT=$(docker inspect $CONTAINER --format '{{index .Config.Labels "traefik.http.services.'$CONTAINER'.loadbalancer.server.port"}}' 2>/dev/null)
    
    if [ -n "$DOMAIN" ]; then
        echo "📦 $CONTAINER"
        echo "   Domínio: $DOMAIN"
        echo "   Porta: $PORT"
        echo ""
    fi
done

echo ""
echo "4️⃣ Como Configurar Domínio Customizado"
echo "======================================"
echo ""
echo "Para usar um domínio customizado como 'teste.icbgravata.com.br':"
echo ""
echo "1. Configure o DNS:"
echo "   - Tipo: A"
echo "   - Nome: teste (ou @ para domínio raiz)"
echo "   - Valor: $(curl -s ifconfig.me 2>/dev/null || echo 'SEU_IP_AQUI')"
echo "   - TTL: 300 (5 minutos)"
echo ""
echo "2. Aguarde propagação do DNS (pode levar até 24h)"
echo ""
echo "3. Teste o DNS:"
echo "   nslookup teste.icbgravata.com.br"
echo "   ping teste.icbgravata.com.br"
echo ""
echo "4. Verifique se Traefik está escutando na porta 80:"
echo "   curl -I http://teste.icbgravata.com.br"
echo ""
echo "5. Se necessário, libere a porta 80 no firewall:"
echo "   sudo ufw allow 80/tcp"
echo "   sudo ufw allow 443/tcp"
echo ""

echo "✅ Verificação concluída!"
